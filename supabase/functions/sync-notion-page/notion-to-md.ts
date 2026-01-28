interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  children?: NotionBlock[];
  [key: string]: any;
}

export class NotionToMarkdown {
  private notionApiKey: string;
  private baseUrl = "https://api.notion.com/v1";

  constructor(apiKey: string) {
    this.notionApiKey = apiKey;
  }

  private async fetch(endpoint: string) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${this.notionApiKey}`,
        "Notion-Version": "2022-06-28",
      },
    });
    if (!res.ok) {
      throw new Error(`Notion API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  // Recursively fetch blocks
  async getBlocks(blockId: string): Promise<NotionBlock[]> {
    let blocks: NotionBlock[] = [];
    let cursor: string | undefined = undefined;

    do {
      const url = `/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
      const data = await this.fetch(url);
      blocks = [...blocks, ...data.results];
      cursor = data.next_cursor;
    } while (cursor);

    // Fetch children sequentially to avoid Notion API rate limits (429)
    for (const block of blocks) {
      if (block.has_children) {
        const children = await this.getBlocks(block.id);
        block.children = children;
      }
    }

    return blocks;
  }

  // Convert blocks to Markdown string
  toMarkdown(blocks: NotionBlock[], depth = 0): string {
    let md = "";

    for (const block of blocks) {
      const content = this.blockToMarkdown(block);
      if (content) {
        md += content + "\n\n";
      }

      if (block.children && block.children.length > 0) {
        // Indentation handling for lists
        const isList = block.type === 'bulleted_list_item' || block.type === 'numbered_list_item';
        const childMd = this.toMarkdown(block.children, depth + 1);

        if (isList) {
            md += childMd.split('\n').map(line => line ? '  ' + line : '').join('\n') + '\n';
        } else if (block.type === 'column_list' || block.type === 'column') {
            md += childMd; // Just render children for columns
        } else if (block.type === 'table') {
            md += childMd; // Table rows handled inside
        } else {
            md += childMd;
        }
      }
    }
    return md.trim();
  }

  private getRichText(richText: any[]): string {
    if (!richText) return "";
    return richText.map((t: any) => {
      let text = t.plain_text;
      if (t.annotations.bold) text = `**${text}**`;
      if (t.annotations.italic) text = `*${text}*`;
      if (t.annotations.code) text = `\`${text}\``;
      if (t.annotations.strikethrough) text = `~~${text}~~`;
      if (t.href) text = `[${text}](${t.href})`;
      return text;
    }).join("");
  }

  private blockToMarkdown(block: NotionBlock): string {
    const type = block.type;
    const data = block[type];

    switch (type) {
      case "paragraph":
        return this.getRichText(data.rich_text);
      case "heading_1":
        return `# ${this.getRichText(data.rich_text)}`;
      case "heading_2":
        return `## ${this.getRichText(data.rich_text)}`;
      case "heading_3":
        return `### ${this.getRichText(data.rich_text)}`;
      case "bulleted_list_item":
        return `- ${this.getRichText(data.rich_text)}`;
      case "numbered_list_item":
        return `1. ${this.getRichText(data.rich_text)}`;
      case "to_do":
        return `- [${data.checked ? "x" : " "}] ${this.getRichText(data.rich_text)}`;
      case "toggle":
        return `<details><summary>${this.getRichText(data.rich_text)}</summary>\n\n</details>`;
      case "code":
        return "```" + data.language + "\n" + this.getRichText(data.rich_text) + "\n```";
      case "image":
        const imgUrl = data.type === "external" ? data.external.url : data.file?.url;
        const imgCaption = data.caption ? this.getRichText(data.caption) : "Image";
        return `![${imgCaption}](${imgUrl})`;
      case "video":
        const vidUrl = data.type === "external" ? data.external.url : data.file?.url;
        return `[Video: ${vidUrl}](${vidUrl})`;
      case "file":
        const fileUrl = data.type === "external" ? data.external.url : data.file?.url;
        const fileName = data.caption ? this.getRichText(data.caption) : "File";
        return `[📎 ${fileName}](${fileUrl})`;
      case "bookmark":
        return `[🔖 ${data.url}](${data.url})`;
      case "embed":
         return `[🔗 Embed](${data.url})`;
      case "equation":
         return `$$ ${data.expression} $$`;
      case "quote":
        return `> ${this.getRichText(data.rich_text)}`;
      case "divider":
        return "---";
      case "callout":
         const icon = data.icon?.emoji || "💡";
         return `> ${icon} **${this.getRichText(data.rich_text)}**`;
      case "table":
         return ""; // Table container, children are rows
      case "table_row":
         // Simple table row support
         const cells = data.cells.map((cell: any) => this.getRichText(cell));
         return `| ${cells.join(" | ")} |`;
      case "column_list":
         return "";
      case "column":
         return "";
      default:
        return "";
    }
  }
}
