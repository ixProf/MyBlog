import { Injectable } from '@angular/core';
import { marked } from 'marked';
import hljs from 'highlight.js';
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

    const self = this;
    const renderer = {
      heading(this: any, token: any) {
        const text = token.tokens ? this.parser.parseInline(token.tokens) : (token.text || '');
        const plainText = (token.text || '').replace(/<[^>]*>/g, '').trim();
        const slug = self.slugify(plainText);
        return `<h${token.depth} id="${slug}" class="doc-heading doc-h${token.depth}" dir="auto">${text}</h${token.depth}>\n`;
      },
      paragraph(this: any, token: any) {
        const text = token.tokens ? this.parser.parseInline(token.tokens) : (token.text || '');
        return `<p dir="auto">${text}</p>\n`;
      },
      blockquote(this: any, token: any) {
        const body = token.tokens ? this.parser.parse(token.tokens) : (token.text || '');
        return `<blockquote dir="auto">\n${body}</blockquote>\n`;
      },
      listitem(this: any, token: any) {
        const body = token.tokens ? this.parser.parse(token.tokens) : (token.text || '');
        return `<li dir="auto">${body}</li>\n`;
      },
      code(this: any, token: any) {
        const rawLang = (token.lang || '').trim().match(/^\S*/)?.[0] || '';
        const lang = rawLang.toLowerCase();
        let highlighted = '';
        let validLang = false;

        if (lang && hljs.getLanguage(lang)) {
          try {
            highlighted = hljs.highlight(token.text, { language: lang, ignoreIllegals: true }).value;
            validLang = true;
          } catch {
            // fallback to auto
          }
        }

        if (!validLang) {
          try {
            const autoResult = hljs.highlightAuto(token.text);
            highlighted = autoResult.value || self.escapeHtml(token.text);
          } catch {
            highlighted = self.escapeHtml(token.text);
          }
        }

        const langClass = rawLang ? ` language-${rawLang}` : '';
        return `<pre dir="ltr" class="code-block" style="direction: ltr; text-align: left;"><code class="hljs${langClass}">${highlighted}</code></pre>\n`;
      }
    };

    marked.use({ renderer });
  }

  escapeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
