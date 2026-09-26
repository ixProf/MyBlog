import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { NotesService } from '../services/notes.service';
import { MarkdownService } from '../services/markdown.service';
import { DrawingCanvasComponent } from '../components/drawing-canvas.component';

@Component({
  selector: 'app-admin-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DrawingCanvasComponent],
  template: `
    <div class="editor-page">
      <div class="container">
        <!-- Top Toolbar Header -->
        <header class="editor-header">
          <div class="header-left">
            <span class="badge badge-peach">Admin Workspace</span>
            <h1 class="editor-title">Distraction-Free Obsidian Editor</h1>
          </div>

          <div class="header-right">
            <!-- Mode Switcher: Blog Post vs Academic Note -->
            <div class="mode-switch">
              <button 
                type="button" 
                class="mode-btn" 
                [class.active]="contentType() === 'blog'" 
                (click)="switchType('blog')"
              >
                Blog Post
              </button>
              <button 
                type="button" 
                class="mode-btn" 
                [class.active]="contentType() === 'note'" 
                (click)="switchType('note')"
              >
                Academic Note
              </button>
            </div>

            <!-- Toggle Drawing Canvas Button -->
            <button 
              type="button" 
              class="btn btn-secondary btn-sm drawing-toggle-btn"
              [class.active]="isDrawingOpen()"
              (click)="isDrawingOpen.set(!isDrawingOpen())"
              title="Open Excalidraw-style canvas to sketch architecture diagrams"
              id="btn-toggle-drawing"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
              <span>{{ isDrawingOpen() ? 'Hide Drawing Canvas' : 'Draw Diagram (Excalidraw)' }}</span>
            </button>

            <!-- Save / Publish -->
            <button 
              type="button" 
              class="btn btn-primary btn-sm" 
              (click)="onSave()" 
              [disabled]="editorForm.invalid || isSaving()"
              id="save-publish-btn"
            >
              @if (isSaving()) {
                <span>Saving...</span>
              } @else {
                <span>{{ editId ? 'Update & Save' : 'Publish ' + (contentType() === 'blog' ? 'Article' : 'Note') }}</span>
              }
            </button>
          </div>
        </header>

        <!-- Embedded Drawing Widget (Excalidraw-style canvas) -->
        @if (isDrawingOpen()) {
          <div class="drawing-drawer">
            <app-drawing-canvas 
              (insertSnippet)="insertDrawingSnippet($event)" 
              (close)="isDrawingOpen.set(false)"
            ></app-drawing-canvas>
          </div>
        }

        <!-- Main Form & Editor Workspace -->
        <form [formGroup]="editorForm" class="editor-form">
          <!-- Metadata Fields -->
          <div class="metadata-grid card">
            @if (contentType() === 'note') {
              <div class="form-group">
                <label for="note-subject">Subject / Course Name <span class="req">*</span></label>
                <input 
                  id="note-subject" 
                  type="text" 
                  formControlName="subject" 
                  class="input" 
                  placeholder="e.g. Operating Systems, Database Internals, Distributed Systems"
                  list="subjects-list"
                />
                <datalist id="subjects-list">
                  @for (s of notesService.getAvailableSubjects(); track s) {
                    <option [value]="s"></option>
                  }
                </datalist>
              </div>
            }

            <div class="form-group title-field">
              <label for="post-title">Title <span class="req">*</span></label>
              <input 
                id="post-title" 
                type="text" 
                formControlName="title" 
                class="input" 
                placeholder="Give your writing a clear, meaningful title..."
              />
            </div>

            @if (contentType() === 'blog') {
              <div class="form-group excerpt-field">
                <label for="post-excerpt">Excerpt / Summary</label>
                <input 
                  id="post-excerpt" 
                  type="text" 
                  formControlName="excerpt" 
                  class="input" 
                  placeholder="Brief synopsis for card feed..."
                />
              </div>

              <div class="form-group">
                <label for="post-tags">Tags (Comma-separated)</label>
                <input 
                  id="post-tags" 
                  type="text" 
                  formControlName="tags" 
                  class="input" 
                  placeholder="e.g. ASP.NET Core, SQL Server, Performance, Clean Architecture"
                />
              </div>

              <!-- Curated Related Articles Picker (Manual Curation) -->
              <div class="form-group related-curation-field">
                <label>Curate Related Articles (Manual Selection)</label>
                <span class="field-hint">Pick which articles appear in the "Related Articles" section at the bottom of this post:</span>
                <div class="related-picker-grid">
                  @for (otherPost of availableOtherPosts(); track otherPost.id) {
                    <button 
                      type="button" 
                      class="related-choice-chip" 
                      [class.selected]="isRelatedSelected(otherPost.id)"
                      (click)="toggleRelated(otherPost.id)"
                    >
                      <span class="choice-check">{{ isRelatedSelected(otherPost.id) ? '✓' : '+' }}</span>
                      <span class="choice-title">{{ otherPost.title }}</span>
                    </button>
                  }
                  @if (availableOtherPosts().length === 0) {
                    <span class="no-others-hint">No other articles available to link yet.</span>
                  }
                </div>
              </div>
            } @else {
              <div class="form-group order-field">
                <label for="note-order">Sort Order Index</label>
                <input 
                  id="note-order" 
                  type="number" 
                  formControlName="order" 
                  class="input" 
                  placeholder="1"
                />
              </div>
            }
          </div>

          <!-- Markdown Formatting Ribbon -->
          <div class="markdown-toolbar">
            <button type="button" class="tool-action-btn" (click)="insertBold()" title="Bold">
              <strong>B</strong>
            </button>
            <button type="button" class="tool-action-btn" (click)="insertItalic()" title="Italic">
              <em>I</em>
            </button>
            <button type="button" class="tool-action-btn" (click)="insertHeading(2)" title="Heading 2">
              H2
            </button>
            <button type="button" class="tool-action-btn" (click)="insertHeading(3)" title="Heading 3">
              H3
            </button>
            <button type="button" class="tool-action-btn" (click)="insertBlockquote()" title="Blockquote">
              ” Quote
            </button>
            <button type="button" class="tool-action-btn" (click)="insertCodeBlock()" title="Code Block">
              &lt;/&gt; Code
            </button>
            <button type="button" class="tool-action-btn" (click)="insertTable()" title="Table">
              Table
            </button>
            <button type="button" class="tool-action-btn" (click)="insertLink()" title="Link">
              Link
            </button>
            <button type="button" class="tool-action-btn" (click)="insertDivider()" title="Divider">
              ― Divider
            </button>
            <button type="button" class="tool-action-btn" (click)="toggleViewMode()">
              <span>{{ viewMode() === 'split' ? 'Full Editor' : 'Side-by-Side Preview' }}</span>
            </button>
          </div>

          <!-- Editor Body (Write vs Side-by-Side Live Preview) -->
          <div class="editor-workspace" [class.split-view]="viewMode() === 'split'">
            <!-- Editor Textarea -->
            <div class="editor-pane">
              <textarea 
                #textareaRef
                formControlName="content" 
                class="editor-textarea" 
                placeholder="Write your note or blog post in Markdown here... Click 'Draw Diagram' above to embed Excalidraw diagrams directly!"
                id="markdown-editor-textarea"
              ></textarea>
            </div>

            <!-- Obsidian-style Live Preview Pane -->
            @if (viewMode() === 'split') {
              <div class="preview-pane card">
                <div class="preview-header">
                  <span class="preview-label">Live Obsidian Preview</span>
                </div>
                <div class="markdown-body" [innerHTML]="livePreview()"></div>
              </div>
            }
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .editor-page {
      padding: 2.5rem 0 5rem 0;
    }
    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .editor-title {
      font-size: 2.2rem;
      color: var(--text-primary);
      margin-top: 0.35rem;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }
    .mode-switch {
      display: flex;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .mode-btn {
      padding: 0.45rem 0.85rem;
      font-size: 0.88rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .mode-btn.active {
      background-color: var(--bg-tint-peach);
      color: var(--text-primary);
      font-weight: 600;
    }
    .drawing-toggle-btn.active {
      background-color: var(--bg-tint-peach);
      border-color: var(--color-warm-peach);
      color: var(--text-primary);
    }
    .drawing-drawer {
      margin-bottom: 1.5rem;
      animation: slideDown 0.25s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .req { color: #EF4444; }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .field-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .related-picker-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.35rem;
    }
    .related-choice-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-xs);
      background-color: var(--bg-surface-tint);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      font-family: inherit;
      transition: all var(--transition-fast);
      text-align: left;
    }
    .related-choice-chip:hover {
      background-color: var(--bg-surface-accent);
      color: var(--text-primary);
    }
    .related-choice-chip.selected {
      background-color: var(--color-warm-peach);
      border-color: var(--color-dark-taupe);
      color: #2E2A26;
      font-weight: 600;
    }
    :host-context(html.dark) .related-choice-chip.selected {
      background-color: rgba(255, 219, 187, 0.25);
      border-color: #FFDBBB;
      color: #FFDBBB;
    }
    .choice-check {
      font-weight: bold;
    }
    .no-others-hint {
      font-size: 0.82rem;
      color: var(--text-muted);
      font-style: italic;
    }
    .markdown-toolbar {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.75rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      border-bottom: none;
      flex-wrap: wrap;
    }
    .tool-action-btn {
      padding: 0.3rem 0.65rem;
      font-size: 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card-secondary);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tool-action-btn:hover {
      background-color: var(--bg-card-hover);
      border-color: var(--interactive);
    }
    .editor-workspace {
      display: grid;
      grid-template-columns: 1fr;
      min-height: 520px;
    }
    .editor-workspace.split-view {
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .editor-pane {
      display: flex;
      flex-direction: column;
    }
    .editor-textarea {
      width: 100%;
      height: 100%;
      min-height: 520px;
      padding: 1.5rem;
      font-family: var(--font-code);
      font-size: 0.95rem;
      line-height: 1.7;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0 0 var(--radius-md) var(--radius-md);
      color: var(--text-primary);
      outline: none;
      resize: vertical;
    }
    .editor-textarea:focus {
      border-color: var(--border-color-focus);
    }
    .preview-pane {
      padding: 1.5rem 2rem;
      overflow-y: auto;
      height: 100%;
      min-height: 520px;
      max-height: 700px;
      background-color: var(--bg-card);
      border-radius: var(--radius-md);
    }
    .preview-header {
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .preview-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    @media (max-width: 850px) {
      .editor-workspace.split-view {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminEditorComponent implements OnInit {
  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  blogService = inject(BlogService);
  notesService = inject(NotesService);
  markdownService = inject(MarkdownService);

  contentType = signal<'blog' | 'note'>('blog');
  isDrawingOpen = signal<boolean>(false);
  viewMode = signal<'write' | 'split'>('split');
  isSaving = signal<boolean>(false);
  editId: number | null = null;
  selectedRelatedIds = signal<number[]>([]);

  editorForm = this.fb.group({
    title: ['', [Validators.required]],
    content: ['', [Validators.required]],
    excerpt: [''],
    tags: [''],
    subject: [''],
    order: [1]
  });

  availableOtherPosts(): any[] {
    return this.blogService.posts().filter(p => p.id !== this.editId);
  }

  isRelatedSelected(id: number): boolean {
    return this.selectedRelatedIds().includes(id);
  }

  toggleRelated(id: number): void {
    const current = this.selectedRelatedIds();
    if (current.includes(id)) {
      this.selectedRelatedIds.set(current.filter(x => x !== id));
    } else {
      this.selectedRelatedIds.set([...current, id]);
    }
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const type = params.get('type');
      if (type === 'note' || type === 'blog') {
        this.switchType(type);
      }
      const subjectParam = params.get('subject');
      if (subjectParam) {
        this.switchType('note');
        this.editorForm.patchValue({ subject: subjectParam });
      }
      const editIdParam = params.get('editId');
      if (editIdParam) {
        this.editId = Number(editIdParam);
        this.loadExistingContent();
      }
    });
  }

  livePreview(): any {
    const content = this.editorForm.get('content')?.value || '';
    return this.markdownService.render(content);
  }

  switchType(type: 'blog' | 'note'): void {
    this.contentType.set(type);
    if (type === 'note') {
      this.editorForm.get('subject')?.setValidators([Validators.required]);
    } else {
      this.editorForm.get('subject')?.clearValidators();
    }
    this.editorForm.get('subject')?.updateValueAndValidity();
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'split' ? 'write' : 'split');
  }

  private loadExistingContent(): void {
    if (!this.editId) return;

    if (this.contentType() === 'blog') {
      const post = this.blogService.posts().find(p => p.id === this.editId);
      if (post) {
        this.editorForm.patchValue({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          tags: post.tags
        });
        if (post.relatedPostIds) {
          const ids = post.relatedPostIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
          this.selectedRelatedIds.set(ids);
        }
      }
    } else {
      const note = this.notesService.notes().find(n => n.id === this.editId);
      if (note) {
        this.editorForm.patchValue({
          title: note.title,
          content: note.content,
          subject: note.subject,
          order: note.order
        });
      }
    }
  }

  insertBold(): void { this.insertMarkdown('**', '**'); }
  insertItalic(): void { this.insertMarkdown('*', '*'); }
  insertHeading(level: number): void { this.insertMarkdown('#'.repeat(level) + ' ', ''); }
  insertBlockquote(): void { this.insertMarkdown('> ', ''); }
  insertCodeBlock(): void { 
    this.insertMarkdown('```csharp\n// ASP.NET Core endpoint or algorithm\n', '\n```'); 
  }
  insertTable(): void {
    const tableSample = '\n| Concept | Guarantee | Latency |\n| :--- | :--- | :--- |\n| Memory Buffer | Write-Ahead Log | < 1ms |\n';
    this.insertMarkdown(tableSample, '');
  }
  insertLink(): void { this.insertMarkdown('[Link Title](', ')'); }
  insertDivider(): void { this.insertMarkdown('\n---\n', ''); }

  private insertMarkdown(prefix: string, suffix: string): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);

    const replacement = prefix + selected + suffix;
    const updated = current.substring(0, start) + replacement + current.substring(end);

    this.editorForm.patchValue({ content: updated });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  insertDrawingSnippet(snippet: string): void {
    const textarea = this.textareaRef?.nativeElement;
    const current = this.editorForm.get('content')?.value || '';

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const updated = current.substring(0, start) + snippet + current.substring(end);
      this.editorForm.patchValue({ content: updated });
    } else {
      this.editorForm.patchValue({ content: current + snippet });
    }

    this.isDrawingOpen.set(false);
  }

  onSave(): void {
    if (this.editorForm.invalid) return;

    this.isSaving.set(true);
    const formVal = this.editorForm.value;

    if (this.contentType() === 'blog') {
      const blogData = {
        title: formVal.title!,
        excerpt: formVal.excerpt || '',
        content: formVal.content!,
        tags: formVal.tags || 'ASP.NET Core, .NET',
        relatedPostIds: this.selectedRelatedIds().join(','),
        readTimeMinutes: Math.max(1, Math.round((formVal.content || '').split(' ').length / 200))
      };

      const action = this.editId
        ? this.blogService.updatePost(this.editId, blogData)
        : this.blogService.createPost(blogData);

      action.subscribe({
        next: post => {
          this.isSaving.set(false);
          alert('Blog post published successfully!');
          this.router.navigate(['/blog', post.slug]);
        },
        error: () => this.isSaving.set(false)
      });
    } else {
      const noteData = {
        subject: formVal.subject || 'General Software Engineering',
        title: formVal.title!,
        content: formVal.content!,
        order: Number(formVal.order) || 1
      };

      const action = this.editId
        ? this.notesService.updateNote(this.editId, noteData)
        : this.notesService.createNote(noteData);

      action.subscribe({
        next: note => {
          this.isSaving.set(false);
          alert('Academic note saved successfully!');
          this.router.navigate(['/notes'], { queryParams: { slug: note.slug } });
        },
        error: () => this.isSaving.set(false)
      });
    }
  }
}
