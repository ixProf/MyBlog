import { Injectable } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TocItem } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  constructor(private sanitizer: DomSanitizer) {
    marked.setOptions({
      gfm: true,
      breaks: true
    });

    const renderer = new marked.Renderer();
    renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
      const plainText = text.replace(/<[^>]*>/g, '').trim();
      const slug = this.slugify(plainText);
      return `<h${depth} id="${slug}" class="doc-heading doc-h${depth}" dir="auto">${text}</h${depth}>\n`;
    };
    renderer.paragraph = ({ text }: { text: string }) => {
      return `<p dir="auto">${text}</p>\n`;
    };
    renderer.blockquote = ({ text }: { text: string }) => {
      return `<blockquote dir="auto">${text}</blockquote>\n`;
    };
    renderer.listitem = ({ text }: { text: string }) => {
      return `<li dir="auto">${text}</li>\n`;
    };

    marked.use({ renderer });
  }

  render(markdown: string): SafeHtml {
    if (!markdown) return '';
    try {
      const parsed = marked.parse(markdown) as string;
      return this.sanitizer.bypassSecurityTrustHtml(parsed);
    } catch (e) {
      console.error('Markdown parse error:', e);
      return markdown;
    }
  }

  renderRaw(markdown: string): string {
    if (!markdown) return '';
    try {
      return marked.parse(markdown) as string;
    } catch {
      return markdown;
    }
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  /**
   * Parses markdown and extracts a nested hierarchical Table of Contents:
   * H1 -> children H2 -> children H3 -> children H4
   */
  extractToc(markdown: string): TocItem[] {
    if (!markdown) return [];

    const lines = markdown.split('\n');
    const flatList: { id: string; text: string; level: number }[] = [];
    let inCodeBlock = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // Check for markdown headings (# Heading)
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        // Strip markdown formatting from title text (like **bold**, `code`, etc.)
        const rawText = match[2]
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .trim();
        const id = this.slugify(rawText);

        flatList.push({ id, text: rawText, level });
      }
    }

    if (flatList.length === 0) return [];

    // Build hierarchical tree
    // Find min heading level (usually 1 or 2)
    const minLevel = Math.min(...flatList.map(h => h.level));
    const roots: TocItem[] = [];
    const stack: TocItem[] = [];

    for (const item of flatList) {
      const node: TocItem = {
        id: item.id,
        text: item.text,
        level: item.level,
        children: []
      };

      if (item.level === minLevel) {
        roots.push(node);
        stack.length = 0;
        stack.push(node);
      } else {
        // Pop items from stack with level >= current
        while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
          stack.pop();
        }

        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          roots.push(node);
        }
        stack.push(node);
      }
    }

    return roots;
  }
}
