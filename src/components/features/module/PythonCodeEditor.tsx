import { logger } from "@/lib/logger";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePyodide } from "@/hooks/usePyodide";
import {
  Play,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Download,
} from "lucide-react";

interface PythonCodeEditorProps {
  initialCode?: string;
  readOnly?: boolean;
  onCodeChange?: (code: string) => void;
}

export function PythonCodeEditor({
  initialCode = '# Tulis kode Python di sini\nprint("Hello, AI World!")',
  readOnly = false,
  onCodeChange,
}: PythonCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isLoading, isReady, loadPyodide, runCode, error: pyodideError } = usePyodide();

  // Auto-load Pyodide on first interaction
  const handleFocus = useCallback(() => {
    if (!isReady && !isLoading) {
      loadPyodide();
    }
  }, [isReady, isLoading, loadPyodide]);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      setCode(newCode);
      onCodeChange?.(newCode);
    },
    [onCodeChange]
  );

  const handleRun = useCallback(async () => {
    if (isRunning || !code.trim()) return;

    setIsRunning(true);
    setOutput("");
    setError("");

    try {
      const result = await runCode(code);
      setOutput(result.output);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred while running the code";
      setError(errorMsg);
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, runCode]);

  const handleReset = useCallback(() => {
    setCode(initialCode);
    setOutput("");
    setError("");
    onCodeChange?.(initialCode);
  }, [initialCode, onCodeChange]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy:", err);
    }
  }, [code]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd + Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
        return;
      }

      // Tab for indentation
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        const newCode = code.substring(0, start) + "    " + code.substring(end);
        setCode(newCode);
        onCodeChange?.(newCode);

        // Reset cursor position
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 4;
        }, 0);
      }
    },
    [code, handleRun, onCodeChange]
  );

  // Calculate line numbers
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-medium text-muted-foreground ml-2">
            Python Editor
          </span>
          {isLoading && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading Python...
            </span>
          )}
          {isReady && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            title="Copy code"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
            title="Reset"
            aria-label="Reset code"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleRun}
            disabled={isRunning || isLoading || !code.trim()}
            size="sm"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div className="flex">
          {/* Line numbers */}
          <div className="flex-shrink-0 bg-muted/30 px-3 py-4 text-right select-none border-r border-border">
            {lineNumbers.map((num) => (
              <div
                key={num}
                className="text-xs text-muted-foreground leading-6 font-mono"
              >
                {num}
              </div>
            ))}
          </div>

          {/* Code area */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            readOnly={readOnly}
            className="flex-1 min-h-[200px] p-4 bg-background font-mono text-sm leading-6 resize-none focus:outline-none"
            placeholder="# Tulis kode Python di sini..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Output Panel */}
      {(output || error || pyodideError) && (
        <div className="border-t border-border">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Output
            </span>
          </div>
          <div className="p-4 font-mono text-sm max-h-[200px] overflow-auto">
            {output && (
              <pre className="text-foreground whitespace-pre-wrap">{output}</pre>
            )}
            {(error || pyodideError) && (
              <pre className="text-destructive-text whitespace-pre-wrap">
                {error || pyodideError}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Ctrl</kbd> +{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Enter</kbd> to run
        </p>
      </div>
    </div>
  );
}
