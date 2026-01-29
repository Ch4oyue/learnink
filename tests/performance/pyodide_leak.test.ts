
import { describe, it, expect } from "bun:test";
import { pyodideManager } from "@/lib/pyodide-manager";

// Define a type for the PyodideManager internals we want to test
interface TestablePyodideManager {
  onStdout: Set<(text: string) => void>;
  worker: MockWorker;
}

// Mock Worker to avoid network/external dependencies
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  listeners: ((event: MessageEvent) => void)[] = [];

  constructor() {
    setTimeout(() => {
       this.dispatch({ type: 'READY' });
    }, 10);
  }

  postMessage() {
      // Intentionally empty for mock
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
      if (type === 'message') this.listeners.push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
      this.listeners = this.listeners.filter(l => l !== listener);
  }

  terminate() {
      // Intentionally empty for mock
  }

  dispatch(data: unknown) {
      const event = { data } as MessageEvent;
      if (this.onmessage) this.onmessage(event);
      this.listeners.forEach(l => l(event));
  }
}

// Override global Worker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.Worker = MockWorker as any;

describe("Pyodide Memory Leak Diagnosis (Fixed)", () => {
  it("should support multiple listeners and allow unsubscribing", async () => {
    // 1. Initialize
    const instance = await pyodideManager.load();
    const manager = pyodideManager as unknown as TestablePyodideManager;

    // 2. Attach Listener A
    let countA = 0;

    const listenerA = (_text: string) => { countA++; };
    const unsubA = instance.setStdout(listenerA);

    // 3. Attach Listener B
    let countB = 0;

    const listenerB = (_text: string) => { countB++; };
    const unsubB = instance.setStdout(listenerB);

    // Verify internal state
    expect(manager.onStdout.size).toBe(2);
    expect(manager.onStdout.has(listenerA)).toBe(true);
    expect(manager.onStdout.has(listenerB)).toBe(true);

    // 4. Simulate usage (should notify both)
    // We can manually trigger internal handler for testing or rely on worker mock
    const workerMock = manager.worker;
    workerMock.dispatch({ type: 'STDOUT', text: 'test' });

    expect(countA).toBe(1);
    expect(countB).toBe(1);

    // 5. Unsubscribe A
    unsubA();

    // Verify A is gone
    expect(manager.onStdout.size).toBe(1);
    expect(manager.onStdout.has(listenerA)).toBe(false);
    expect(manager.onStdout.has(listenerB)).toBe(true);

    // 6. Unsubscribe B
    unsubB();
    expect(manager.onStdout.size).toBe(0);

    console.log("Verified: Listeners are correctly removed. No leak.");
  });
});
