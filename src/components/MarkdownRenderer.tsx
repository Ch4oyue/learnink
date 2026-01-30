import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PythonCodeEditor } from "@/components/module/PythonCodeEditor";
import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableCodeEditor?: boolean;
  variant?: 'default' | 'compact';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function MarkdownRenderer({
  content,
  className,
  enableCodeEditor = true,
  variant = 'default',
}: MarkdownRendererProps) {

  const components: Components = {
    h1: ({ children, ...props }) => {
      const text = String(children);
      const id = `heading-${slugify(text)}`;
      return <h1 id={id} className="text-3xl font-bold mt-12 mb-6 text-foreground scroll-mt-24" {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }) => {
      const text = String(children);
      const id = `heading-${slugify(text)}`;
      return <h2 id={id} className="text-2xl font-bold mt-12 mb-5 text-foreground scroll-mt-24" {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      const id = `heading-${slugify(text)}`;
      return <h3 id={id} className="text-xl font-semibold mt-10 mb-4 text-foreground scroll-mt-24" {...props}>{children}</h3>;
    },
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith('http') ?? false;
      return (
        <a
          href={href}
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
                <div className="my-6">
                    <PythonCodeEditor initialCode={String(children).replace(/\n$/, '')} />
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
    ul: ({ children }) => <ul className="my-4 space-y-2 list-disc pl-6">{children}</ul>,
    ol: ({ children }) => <ol className="my-4 space-y-2 list-decimal pl-6">{children}</ol>,
    li: ({ children }) => <li className="text-foreground/90 leading-relaxed pl-1 marker:text-foreground/50">{children}</li>,
    p: ({ children }) => <p className="my-5 text-foreground/90 leading-loose">{children}</p>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">{children}</blockquote>,
    hr: () => <hr className="my-6 border-border" />,
  };

  return (
    <div className={cn("w-full max-w-none", variant === 'default' ? "space-y-6" : "space-y-0", className)}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
            className={cn("prose prose-slate dark:prose-invert max-w-none", variant === 'compact' && "prose-p:my-0 prose-li:my-0 prose-ul:my-0 prose-ol:my-0")}
        >
            {content}
        </ReactMarkdown>
    </div>
  );
}
