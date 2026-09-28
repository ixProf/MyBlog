import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownService } from './markdown.service';

describe('MarkdownService', () => {
  let service: MarkdownService;
  const mockSanitizer = {
    bypassSecurityTrustHtml: (val: string) => val
  } as any;

  beforeEach(() => {
    service = new MarkdownService(mockSanitizer);
  });

  it('renders bold and italic formatting without literal asterisks', () => {
    const raw = 'Paragraph with **bold text** and *italic text*.';
    const rendered = service.renderRaw(raw);

    expect(rendered).toContain('<strong>bold text</strong>');
    expect(rendered).toContain('<em>italic text</em>');
    expect(rendered).not.toContain('**');
    expect(rendered).not.toContain('*italic*');
  });

  it('preserves dir="auto" on paragraphs, headings, blockquotes, and lists', () => {
    const md = `
# Sample Heading
A paragraph
> A blockquote
- List item
`;
    const rendered = service.renderRaw(md);
    expect(rendered).toContain('<h1 id="sample-heading" class="doc-heading doc-h1" dir="auto">');
    expect(rendered).toContain('<p dir="auto">');
    expect(rendered).toContain('<blockquote dir="auto">');
    expect(rendered).toContain('<li dir="auto">');
  });

  it('highlights code blocks with highlight.js and ensures LTR direction', () => {
    const code = `
\`\`\`csharp
public class OrderService {
    public int Count => 10;
}
\`\`\`
`;
    const rendered = service.renderRaw(code);
    expect(rendered).toContain('dir="ltr"');
    expect(rendered).toContain('class="hljs language-csharp"');
    expect(rendered).toContain('hljs-keyword');
    expect(rendered).toContain('public');
  });

  it('auto-detects language when none is specified', () => {
    const code = `
\`\`\`
const greeting = "Hello world";
console.log(greeting);
\`\`\`
`;
    const rendered = service.renderRaw(code);
    expect(rendered).toContain('dir="ltr"');
    expect(rendered).toContain('class="hljs"');
  });
});
