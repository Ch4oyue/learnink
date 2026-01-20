import { cn } from "@/lib/utils";
import { PythonCodeEditor } from "@/components/module/PythonCodeEditor";
import DOMPurify from "dompurify";
import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableCodeEditor?: boolean;
}

const purifyConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i',
    'code', 'pre',
    'blockquote',
    'a',
    'span', 'div'
  ],
  ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'id'],
  ALLOW_DATA_ATTR: false,
};

// Add hook to ensure all links have security attributes
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node instanceof HTMLAnchorElement && 'target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener nofollow noreferrer');
  }
});

interface ParsedContent {
  type: 'html' | 'python-code';
  content: string;
  key: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parseMarkdown(text: string): string {
  let html = text;
  const usedIds = new Map<string, number>();

  const generateId = (headingText: string): string => {
    const baseId = `heading-${slugify(headingText)}`;
    const count = usedIds.get(baseId) || 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;
    usedIds.set(baseId, count + 1);
    return id;
  };

  html = html.replace(/^### (.*$)/gim, (_, p1) => {
    const id = generateId(p1);
    return `<h3 id="${id}" class="text-xl font-semibold mt-10 mb-4 text-foreground scroll-mt-24">${p1}</h3>`;
  });
  html = html.replace(/^## (.*$)/gim, (_, p1) => {
    const id = generateId(p1);
    return `<h2 id="${id}" class="text-2xl font-bold mt-12 mb-5 text-foreground scroll-mt-24">${p1}</h2>`;
  });
  html = html.replace(/^# (.*$)/gim, (_, p1) => {
    const id = generateId(p1);
    return `<h1 id="${id}" class="text-3xl font-bold mt-12 mb-6 text-foreground scroll-mt-24">${p1}</h1>`;
  });

  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="font-bold"><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-foreground">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim,
    '<pre class="bg-muted rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-foreground">$2</code></pre>');

  html = html.replace(/`([^`]+)`/gim,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">$1</code>');

  html = html.replace(/^> (.*$)/gim,
    '<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">$1</blockquote>');

  html = html.replace(/^\* (.*$)/gim, '<li class="ml-6 list-disc text-foreground/90 leading-relaxed">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-6 list-disc text-foreground/90 leading-relaxed">$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal text-foreground/90 leading-relaxed">$1</li>');

  html = html.replace(/(<li class="ml-6 list-disc.*?<\/li>\n?)+/gim, (match) =>
    `<ul class="my-4 space-y-2">${match}</ul>`);
  html = html.replace(/(<li class="ml-6 list-decimal.*?<\/li>\n?)+/gim, (match) =>
    `<ol class="my-4 space-y-2">${match}</ol>`);

  html = html.replace(/^---$/gim, '<hr class="my-6 border-border" />');

  // Handle links with external detection
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_, text, url) => {
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    if (isExternal) {
      // External link: add icon (security attributes handled by DOMPurify hook)
      return `<a href="${url}" class="text-primary hover:underline inline-flex items-center gap-1">${text}<svg class="inline-block w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>`;
    } else {
      // Internal link
      return `<a href="${url}" class="text-primary hover:underline">${text}</a>`;
    }
  });

  html = html.split('\n\n').map(paragraph => {
    const trimmed = paragraph.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return trimmed;
    return `<p class="my-5 text-foreground/90 leading-loose">${trimmed}</p>`;
  }).join('\n');

  html = html.replace(/(?<!>)\n(?!<)/gim, '<br />');

  return html;
}

export function MarkdownRenderer({
  content,
  className,
  enableCodeEditor = true,
}: MarkdownRendererProps) {

  const parsedContent = useMemo(() => {
    const segments: ParsedContent[] = [];
    let segmentIndex = 0;

    const pythonCodeRegex = /```python\n([\s\S]*?)```/gim;
    let lastIndex = 0;
    let match;

    while ((match = pythonCodeRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          segments.push({
            type: 'html',
            content: DOMPurify.sanitize(parseMarkdown(textBefore), purifyConfig),
            key: `html-${segmentIndex++}`,
          });
        }
      }

      segments.push({
        type: 'python-code',
        content: match[1].trim(),
        key: `python-${segmentIndex++}`,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remaining = content.substring(lastIndex);
      if (remaining.trim()) {
        segments.push({
          type: 'html',
          content: DOMPurify.sanitize(parseMarkdown(remaining), purifyConfig),
          key: `html-${segmentIndex++}`,
        });
      }
    }

    if (segments.length === 0) {
      segments.push({
        type: 'html',
        content: DOMPurify.sanitize(parseMarkdown(content), purifyConfig),
        key: 'html-0',
      });
    }

    return segments;
  }, [content]);

  return (
    <div className={cn("space-y-6", className)}>
      {parsedContent.map((segment) => {
        if (segment.type === 'python-code' && enableCodeEditor) {
          return (
            <div key={segment.key} className="my-6">
              <PythonCodeEditor initialCode={segment.content} />
            </div>
          );
        }

        return (
          <div
            key={segment.key}
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: segment.content }}
          />
        );
      })}
    </div>
  );
}
