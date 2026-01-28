interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
}

interface RichTextAnnotation {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

interface RichText {
  plain_text: string;
  href?: string | null;
  annotations: RichTextAnnotation;
  type?: string;
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
      // Handle rate limits or errors gracefully
      if (res.status === 429) {
          // Simple backoff could be implemented here, or just throw
          throw new Error("Notion API Rate Limit Exceeded");
      }
      throw new Error(`Notion API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  // Recursively fetch blocks
  async getBlocks(blockId: string): Promise<NotionBlock[]> {
    let blocks: NotionBlock[] = [];
    let cursor: string | undefined = undefined;

    try {
      do {
        const url: string = `/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
        const data = await this.fetch(url);
        blocks = [...blocks, ...data.results];
        cursor = data.next_cursor;
      } while (cursor);
    } catch (e) {
      console.error(`Error fetching blocks for ${blockId}:`, e);
      return []; // Return partial blocks if fails
    }

    // Fetch children strictly sequentially to avoid rate limits
    // Optimization: Only fetch children for supported container types to save API calls
    const containerTypes = ['toggle', 'column_list', 'column', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote', 'callout', 'table', 'synced_block'];

    for (const block of blocks) {
      if (block.has_children && containerTypes.includes(block.type)) {
        // recursive call
        const children = await this.getBlocks(block.id);
        block.children = children;
      }
    }

    return blocks;
  }

  // Convert blocks to Markdown string
  toMarkdown(blocks: NotionBlock[], depth = 0): string {
    let md = "";

    // Helper to handle list numbering resets
    let numberListIndex = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const prevBlock = blocks[i-1];

      // Reset numbered list index if previous block wasn't a numbered list
      if (block.type === 'numbered_list_item') {
          if (prevBlock?.type !== 'numbered_list_item') {
              numberListIndex = 1;
          } else {
              numberListIndex++;
          }
      }

      const content = this.blockToMarkdown(block, numberListIndex);

      if (content) {
        // Add indentation for current depth
        // But blockToMarkdown usually handles the prefix.
        // We mainly need to handle the *children's* indentation.
        md += content + "\n\n";
      }

      if (block.children && block.children.length > 0) {
        const childMd = this.toMarkdown(block.children, depth + 1);

        // Indentation logic
        if (block.type === 'table') {
            // Table children are rows, processed inside blockToMarkdown usually?
            // Actually notion table rows are children blocks.
            // We need to render them specially.
            // Let's handle table rows in blockToMarkdown if possible, or here.
            // If blockToMarkdown returned the header, childMd is the body?
            // Notion table structure: Table Block -> Children (Row Blocks) -> Cells
            // So blockToMarkdown for Table returns nothing, and we render children.
        }

        // Standard indentation for lists/toggles
        const indent = (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item' || block.type === 'to_do') ? "   " : "";

        if (childMd) {
             const indentedChildren = childMd.split('\n').map(line => line ? indent + line : '').join('\n');
             md += indentedChildren + "\n\n";
        }
      }
    }
    return md.trim();
  }

  private getRichText(richText: RichText[]): string {
    if (!richText) return "";
    return richText.map((t) => {
      let text = t.plain_text;
      if (t.annotations.bold) text = `**${text}**`;
      if (t.annotations.italic) text = `*${text}*`;
      if (t.annotations.code) text = `\`${text}\``;
      if (t.annotations.strikethrough) text = `~~${text}~~`;
      if (t.href) text = `[${text}](${t.href})`;
      return text;
    }).join("");
  }

  private blockToMarkdown(block: NotionBlock, listIndex = 1): string {
    const type = block.type;
    const data = block[type] as Record<string, unknown>;

    switch (type) {
      case "paragraph":
        return this.getRichText(data.rich_text as RichText[]);
      case "heading_1":
        return `# ${this.getRichText(data.rich_text as RichText[])}`;
      case "heading_2":
        return `## ${this.getRichText(data.rich_text as RichText[])}`;
      case "heading_3":
        return `### ${this.getRichText(data.rich_text as RichText[])}`;
      case "bulleted_list_item":
        return `- ${this.getRichText(data.rich_text as RichText[])}`;
      case "numbered_list_item":
        return `${listIndex}. ${this.getRichText(data.rich_text as RichText[])}`;
      case "to_do":
        return `- [${data.checked ? "x" : " "}] ${this.getRichText(data.rich_text as RichText[])}`;
      case "toggle":
        return `<details><summary>${this.getRichText(data.rich_text as RichText[])}</summary>`; // Children will follow
      case "code":
        return "```" + (data.language || "") + "\n" + this.getRichText(data.rich_text as RichText[]) + "\n```";
      case "image": {
        const external = data.external as { url: string } | undefined;
        const file = data.file as { url: string } | undefined;
        const imgUrl = data.type === "external" ? external?.url : file?.url;
        const caption = data.caption ? this.getRichText(data.caption as RichText[]) : "Image";
        return `![${caption}](${imgUrl})`;
      }
      case "video": {
        const external = data.external as { url: string } | undefined;
        const file = data.file as { url: string } | undefined;
        const vidUrl = data.type === "external" ? external?.url : file?.url;
        return `[Video: ${vidUrl}](${vidUrl})`;
      }
      case "file": {
        const external = data.external as { url: string } | undefined;
        const file = data.file as { url: string } | undefined;
        const fileUrl = data.type === "external" ? external?.url : file?.url;
        const fileName = data.caption ? this.getRichText(data.caption as RichText[]) : "File";
        return `[📎 ${fileName}](${fileUrl})`;
      }
      case "bookmark":
        return `[🔖 ${data.url}](${data.url})`;
      case "embed":
         return `[🔗 Embed](${data.url})`;
      case "equation":
         return `$$ ${data.expression} $$`;
      case "quote":
        return `> ${this.getRichText(data.rich_text as RichText[])}`;
      case "divider":
        return "---";
      case "callout": {
         const iconData = data.icon as { emoji?: string } | undefined;
         const icon = iconData?.emoji || "💡";
         return `> ${icon} **${this.getRichText(data.rich_text as RichText[])}**`;
      }
      case "table":
         return ""; // Container
      case "table_row": {
         const cells = data.cells as RichText[][];
         const cellContent = cells.map((cell) => this.getRichText(cell));
         return `| ${cellContent.join(" | ")} |`;
      }
      case "column_list":
         return ""; // Container
      case "column":
         return ""; // Container
      default:
        return "";
    }
  }
}
