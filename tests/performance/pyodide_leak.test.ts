
import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { pyodideManager } from "@/lib/pyodide-manager";

// Mock Worker to avoid network/external dependencies
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  listeners: ((event: MessageEvent) => void)[] = [];

  constructor(url: string | URL, options?: WorkerOptions) {
    setTimeout(() => {
       this.dispatch({ type: 'READY' });
    }, 10);
  }

  postMessage(msg: any) {}

  addEventListener(type: string, listener: any) {
      if (type === 'message') this.listeners.push(listener);
  }

  removeEventListener(type: string, listener: any) {
      this.listeners = this.listeners.filter(l => l !== listener);
  }

  terminate() {}

  dispatch(data: any) {
      const event = { data } as MessageEvent;
      if (this.onmessage) this.onmessage(event);
      this.listeners.forEach(l => l(event));
  }
}

// Override global Worker
global.Worker = MockWorker as any;

describe("Pyodide Memory Leak Diagnosis (Fixed)", () => {
  it("should support multiple listeners and allow unsubscribing", async () => {
    // 1. Initialize
    const instance = await pyodideManager.load();

    // 2. Attach Listener A
    let countA = 0;
    const listenerA = (text: string) => { countA++; };
    const unsubA = instance.setStdout(listenerA);

    // 3. Attach Listener B
    let countB = 0;
    const listenerB = (text: string) => { countB++; };
    const unsubB = instance.setStdout(listenerB);

    // Verify internal state (using @ts-ignore)
    // @ts-ignore
    expect(pyodideManager.onStdout.size).toBe(2);
    // @ts-ignore
    expect(pyodideManager.onStdout.has(listenerA)).toBe(true);
    // @ts-ignore
    expect(pyodideManager.onStdout.has(listenerB)).toBe(true);

    // 4. Simulate usage (should notify both)
    // We can manually trigger internal handler for testing or rely on worker mock
    // @ts-ignore
    const workerMock = pyodideManager.worker as MockWorker;
    workerMock.dispatch({ type: 'STDOUT', text: 'test' });

    expect(countA).toBe(1);
    expect(countB).toBe(1);

    // 5. Unsubscribe A
    unsubA();

    // Verify A is gone
    // @ts-ignore
    expect(pyodideManager.onStdout.size).toBe(1);
    // @ts-ignore
    expect(pyodideManager.onStdout.has(listenerA)).toBe(false);
    // @ts-ignore
    expect(pyodideManager.onStdout.has(listenerB)).toBe(true);

    // 6. Unsubscribe B
    unsubB();
    // @ts-ignore
    expect(pyodideManager.onStdout.size).toBe(0);

    console.log("Verified: Listeners are correctly removed. No leak.");
  });
});
