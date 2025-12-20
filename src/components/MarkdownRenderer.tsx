import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Configure DOMPurify to allow safe HTML elements
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
  ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Simple markdown parser for common elements
  const parseMarkdown = (text: string): string => {
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-foreground">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-foreground">$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="font-bold"><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-foreground">$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, 
      '<pre class="bg-muted rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-foreground">$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/gim, 
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">$1</code>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, 
      '<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">$1</blockquote>');
    
    // Unordered lists
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-foreground/90">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-foreground/90">$1</li>');
    
    // Ordered lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-foreground/90">$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li class="ml-4 list-disc.*?<\/li>\n?)+/gim, (match) => 
      `<ul class="my-4 space-y-2">${match}</ul>`);
    html = html.replace(/(<li class="ml-4 list-decimal.*?<\/li>\n?)+/gim, (match) => 
      `<ol class="my-4 space-y-2">${match}</ol>`);
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-6 border-border" />');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, 
      '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Paragraphs - wrap remaining text blocks
    html = html.split('\n\n').map(paragraph => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';
      // Don't wrap if already wrapped in HTML tags
      if (trimmed.startsWith('<')) return trimmed;
      return `<p class="my-4 text-foreground/90 leading-relaxed">${trimmed}</p>`;
    }).join('\n');
    
    // Single line breaks within paragraphs
    html = html.replace(/(?<!>)\n(?!<)/gim, '<br />');
    
    return html;
  };

  // Sanitize the parsed HTML to prevent XSS attacks
  const sanitizedHtml = DOMPurify.sanitize(parseMarkdown(content), purifyConfig);

  return (
    <div 
      className={cn("prose prose-slate dark:prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
