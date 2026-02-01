import { cn } from "@/lib/utils";
import { lazy, Suspense, useMemo, memo, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import { Link2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';

// Lazy load PythonCodeEditor as it is heavy and may not be needed
const PythonCodeEditor = lazy(() => import("@/components/features/module/PythonCodeEditor").then(m => ({ default: m.PythonCodeEditor })));

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('html', markup);

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableCodeEditor?: boolean;
  variant?: 'default' | 'compact';
}

// Cache for slugify results to avoid repeated calculations
const slugCache = new Map<string, string>();

function slugify(text: string): string {
  if (slugCache.has(text)) return slugCache.get(text)!;

  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  slugCache.set(text, slug);
  return slug;
}

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Block dangerous protocols
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:')) {
    return undefined;
  }

  // Verify with DOMPurify (defense in depth)
  try {
    const dirty = `<a href="${trimmed}"></a>`;
    const clean = DOMPurify.sanitize(dirty);
    // If DOMPurify removed the href attribute, it considered it unsafe
    if (!clean.includes('href')) return undefined;
  } catch (e) {
    // Ignore errors in environments without DOM (e.g. server-side rendering tests)
  }

  return trimmed;
}

export const MarkdownRenderer = memo(({
  content,
  className,
  enableCodeEditor = true,
  variant = 'default',
}: MarkdownRendererProps) => {
  const { toast } = useToast();

  const copyLink = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.hash = id;
    navigator.clipboard.writeText(url.toString());
    toast({ title: "Link bagian disalin!" });
  }, [toast]);

  const components: Components = useMemo(() => ({
    h1: ({ children, ...props }) => {
      const text = String(children);
      const id = `heading-${slugify(text)}`;
      return (
        <h1 id={id} className="group/h text-3xl font-bold mt-12 mb-6 text-foreground scroll-mt-24 flex items-center gap-2" {...props}>
          {children}
          <button
            onClick={() => copyLink(id)}
            className="opacity-0 group-hover/h:opacity-100 transition-opacity p-1 hover:text-primary"
            aria-label="Salin link bagian"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const text = String(children);
      const id = `heading-${slugify(text)}`;
      return (
        <h2 id={id} className="group/h text-2xl font-bold mt-12 mb-5 text-foreground scroll-mt-24 flex items-center gap-2" {...props}>
          {children}
          <button
            onClick={() => copyLink(id)}
            className="opacity-0 group-hover/h:opacity-100 transition-opacity p-1 hover:text-primary"
            aria-label="Salin link bagian"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      const id = `heading-${slugify(text)}`;
      return (
        <h3 id={id} className="group/h text-xl font-semibold mt-10 mb-4 text-foreground scroll-mt-24 flex items-center gap-2" {...props}>
          {children}
          <button
            onClick={() => copyLink(id)}
            className="opacity-0 group-hover/h:opacity-100 transition-opacity p-1 hover:text-primary"
            aria-label="Salin link bagian"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </h3>
      );
    },
    a: ({ href, children, ...props }) => {
      const safeHref = sanitizeUrl(href);
      if (!safeHref) {
        // Render as plain text or span if link is unsafe
        return <span className="text-muted-foreground">{children}</span>;
      }

      const isExternal = safeHref.startsWith('http');
      return (
        <a
          href={safeHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={cn("text-primary hover:underline inline-flex items-center gap-1", isExternal && "items-baseline")}
          {...props}
        >
          {children}
          {isExternal && (
            <svg className="inline-block w-3 h-3 opacity-60 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          )}
        </a>
      );
    },
    code: ({ node, inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean, node?: object }) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';

        if (!inline && language === 'python' && enableCodeEditor) {
            return (
                <div className="my-6 min-h-[200px]">
                    <Suspense fallback={
                        <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                            <span className="text-sm text-muted-foreground">Loading Python Editor...</span>
                        </div>
                    }>
                        <PythonCodeEditor initialCode={String(children).replace(/\n$/, '')} />
                    </Suspense>
                </div>
            );
        }

        if (!inline && match) {
             return (
                <div className="rounded-lg overflow-hidden my-4">
                    <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
            )
        }

        return (
            <code className={cn("bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground", className)} {...props}>
                {children}
            </code>
        );
    },
    pre: ({ children }) => <>{children}</>,
    ul: ({ children, ...props }) => <ul className="my-4 space-y-2 list-disc pl-6" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="my-4 space-y-2 list-decimal pl-6" {...props}>{children}</ol>,
    li: ({ children, ...props }) => <li className="text-foreground/90 leading-relaxed pl-1 marker:text-foreground/50" {...props}>{children}</li>,
    p: ({ children }) => <p className="my-5 text-foreground/90 leading-loose">{children}</p>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">{children}</blockquote>,
    hr: () => <hr className="my-6 border-border" />,
  }), [enableCodeEditor, copyLink]);

  return (
    <div className={cn(
        "w-full max-w-none prose prose-slate dark:prose-invert",
        variant === 'default' ? "space-y-6" : "space-y-0",
        variant === 'compact' && "prose-p:my-0 prose-li:my-0 prose-ul:my-0 prose-ol:my-0",
        className
    )}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
        >
            {content}
        </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
