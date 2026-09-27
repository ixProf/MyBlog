import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../services/notes.service';
import { MarkdownService } from '../services/markdown.service';
import { AuthService } from '../services/auth.service';
import { TranslationService } from '../services/translation.service';
import { AcademicNote, TocItem } from '../models/models';
import { TableOfContentsComponent } from '../components/table-of-contents.component';

@Component({
  selector: 'app-academic-notes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TableOfContentsComponent],
  template: `
    <div class="docs-layout">
      <!-- Left Course Tree Sidebar (Sticky) -->
      <aside class="docs-sidebar" [class.mobile-open]="sidebarMobileOpen()">
        <div class="sidebar-header">
          <div class="sidebar-title-group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <h2 class="sidebar-heading">{{ ts.t('notes.folders_heading') }}</h2>
          </div>
          @if (authService.isAdmin()) {
            <div class="sidebar-header-actions">
              <button 
                type="button" 
                class="header-action-btn" 
                [class.active]="showNewFolderForm()" 
                (click)="showNewFolderForm.set(!showNewFolderForm())"
                title="Create New Subject Folder"
                id="btn-create-folder"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                <span>{{ ts.t('notes.btn_add_folder') }}</span>
              </button>
              <a [routerLink]="['/editor']" [queryParams]="{ type: 'note' }" class="header-action-btn" title="Add New Lecture Note" id="btn-add-note">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>{{ ts.t('notes.btn_add_note') }}</span>
              </a>
            </div>
          }
        </div>

        <!-- Inline Create Folder Input for Admin -->
        @if (authService.isAdmin() && showNewFolderForm()) {
          <div class="new-folder-card">
            <div class="new-folder-label">{{ ts.t('notes.new_folder_title') }}</div>
            <div class="new-folder-input-row">
              <input 
                type="text" 
                [(ngModel)]="newFolderName" 
                [placeholder]="ts.t('notes.folder_name_placeholder')" 
                class="input new-folder-input"
                (keydown.enter)="onCreateSubject()"
                (keydown.escape)="showNewFolderForm.set(false)"
                id="input-new-folder"
              />
            </div>
            <div class="new-folder-actions">
              <button 
                type="button" 
                class="btn btn-primary btn-xs" 
                (click)="onCreateSubject()" 
                [disabled]="!newFolderName.trim()"
                id="btn-submit-folder"
              >
                {{ ts.t('notes.create_folder') }}
              </button>
              <button type="button" class="btn btn-secondary btn-xs" (click)="showNewFolderForm.set(false)">
                {{ ts.t('notes.cancel') }}
              </button>
            </div>
          </div>
        }

        <div class="sidebar-search">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            [placeholder]="ts.t('notes.search_placeholder')" 
            class="input search-docs-input"
            id="docs-search-input"
          />
        </div>

        <!-- Course Folders & Notes Hierarchy Navigation -->
        <nav class="sidebar-nav">
          @for (group of groupedSubjects(); track group.subject) {
            <div class="folder-group" [class.is-expanded]="isFolderExpanded(group.subject)">
              <!-- Folder Header Row -->
              <div 
                class="folder-header-row" 
                (click)="toggleFolder(group.subject)"
                [attr.aria-expanded]="isFolderExpanded(group.subject)"
                role="button"
                tabindex="0"
                (keydown.enter)="toggleFolder(group.subject)"
              >
                <div class="folder-header-main">
                  <span class="chevron-wrap">
                    <svg 
                      class="folder-chevron" 
                      [class.rotated]="isFolderExpanded(group.subject)" 
                      width="13" 
                      height="13" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2.5"
                    >
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </span>
                  
                  <span class="folder-icon-wrap">
                    <svg class="folder-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (isFolderExpanded(group.subject)) {
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                      } @else {
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      }
                    </svg>
                  </span>

                  <span class="folder-title" [title]="group.subject">{{ group.subject }}</span>
                </div>

                <div class="folder-header-aside">
                  <span class="folder-count" [class.zero-count]="group.count === 0" [title]="group.count + ' note' + (group.count === 1 ? '' : 's')">
                    {{ group.count }}
                  </span>

                  @if (authService.isAdmin()) {
                    <div class="folder-hover-tools" (click)="$event.stopPropagation()">
                      <a 
                        [routerLink]="['/editor']" 
                        [queryParams]="{ type: 'note', subject: group.subject }" 
                        class="folder-mini-tool" 
                        title="Add note to {{ group.subject }}"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </a>
                      <button 
                        type="button" 
                        class="folder-mini-tool delete" 
                        (click)="onDeleteSubject(group.subject, group.count)" 
                        title="Delete folder and notes"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Collapsible Notes Nested List -->
              @if (isFolderExpanded(group.subject)) {
                <ul class="folder-notes-list">
                  @for (item of group.notes; track item.id) {
                    <li>
                      <button 
                        type="button" 
                        class="note-link" 
                        [class.active]="selectedNote()?.id === item.id"
                        (click)="selectNote(item.slug)"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="doc-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span class="note-title-text">{{ item.title }}</span>
                      </button>
                    </li>
                  }
                  @if (group.notes.length === 0) {
                    <li class="folder-empty-state">
                      <span class="folder-empty-label">No notes yet</span>
                      @if (authService.isAdmin()) {
                        <a [routerLink]="['/editor']" [queryParams]="{ type: 'note', subject: group.subject }" class="folder-empty-add-btn">
                          + Add Note
                        </a>
                      }
                    </li>
                  }
                </ul>
              }
            </div>
          }
          @if (groupedSubjects().length === 0) {
            <div class="sidebar-empty-state">
              <span>No folders found.</span>
            </div>
          }
        </nav>
      </aside>

      <!-- Main Docs Content Area (Unboxed, flows on background) + Sticky Right TOC Sidebar -->
      <main class="docs-main-container">
        <!-- Mobile Sidebar Toggle -->
        <button class="mobile-sidebar-toggle" (click)="sidebarMobileOpen.set(!sidebarMobileOpen())">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <span>{{ sidebarMobileOpen() ? 'Hide Folders Tree' : 'View Course Folders' }}</span>
        </button>

        @if (selectedNote()) {
          <div class="docs-inner-grid">
            <!-- Documentation Article Column (No wrapping card, flows on background) -->
            <article class="doc-note-article">
              <!-- Documentation Breadcrumbs -->
              <nav class="doc-breadcrumbs" aria-label="Breadcrumbs">
                <a routerLink="/" class="breadcrumb-link">{{ ts.t('nav.home') }}</a>
                <span class="bc-sep">/</span>
                <a routerLink="/notes" class="breadcrumb-link">{{ ts.t('nav.notes') }}</a>
                <span class="bc-sep">/</span>
                <span class="bc-subject">{{ selectedNote()!.subject }}</span>
                <span class="bc-sep">/</span>
                <span class="bc-current">{{ selectedNote()!.title }}</span>
              </nav>

              <!-- Plain Metadata Header (no boxed container) -->
              <header class="doc-note-header">
                <h1 class="doc-note-title" dir="auto">{{ selectedNote()!.title }}</h1>

                <div class="doc-meta-row">
                  <span class="badge badge-peach">{{ selectedNote()!.subject }}</span>
                  <span class="meta-separator">&bull;</span>
                  <span class="meta-inst">{{ ts.t('footer.academic_1') }}</span>
                  <span class="meta-separator">&bull;</span>
                  <time class="meta-updated">{{ selectedNote()!.updatedAt | date:'mediumDate' }}</time>
                  @if (authService.isAdmin()) {
                    <span class="meta-separator">&bull;</span>
                    <a [routerLink]="['/editor']" [queryParams]="{ editId: selectedNote()!.id, type: 'note' }" class="edit-link">
                      {{ ts.t('notes.edit_note') }}
                    </a>
                    <button type="button" class="delete-btn-text" (click)="onDeleteNote(selectedNote()!.id)">
                      {{ ts.t('notes.delete_note') }}
                    </button>
                  }
                </div>
              </header>

              <div class="doc-divider"></div>

              <!-- Markdown Content Render with natural page flow -->
              <div class="markdown-body doc-markdown" [innerHTML]="renderedContent()" dir="auto"></div>

              <!-- Bottom Pagination (Previous / Next Note) -->
              <div class="docs-pager">
                @if (previousNote()) {
                  <button type="button" class="pager-btn pager-prev" (click)="selectNote(previousNote()!.slug)">
                    <span class="pager-dir">&larr;</span>
                    <span class="pager-title">{{ previousNote()!.title }}</span>
                  </button>
                } @else {
                  <div></div>
                }

                @if (nextNote()) {
                  <button type="button" class="pager-btn pager-next" (click)="selectNote(nextNote()!.slug)">
                    <span class="pager-dir">&rarr;</span>
                    <span class="pager-title">{{ nextNote()!.title }}</span>
                  </button>
                }
              </div>
            </article>

            <!-- Sticky Right Sidebar: Table of Contents (Dedicated column, never overlaps text) -->
            <aside class="docs-toc-sidebar" aria-label="Table of contents">
              <app-table-of-contents [items]="tocItems()"></app-table-of-contents>
            </aside>
          </div>
        } @else {
          <div class="empty-docs">
            <h3>{{ ts.t('notes.select_prompt_title') }}</h3>
            <p>{{ ts.t('notes.select_prompt_desc') }}</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .docs-layout {
      display: grid;
      grid-template-columns: 290px minmax(0, 1fr);
      min-height: calc(100vh - 72px);
      background-color: var(--bg-main);
      align-items: start;
    }
    .docs-sidebar {
      background-color: var(--bg-surface);
      border-right: 1px solid var(--border-color);
      padding: 1.75rem 1.15rem;
      position: sticky;
      top: 72px;
      height: calc(100vh - 72px);
      overflow-y: auto;
      scrollbar-width: thin;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .sidebar-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
    }
    .sidebar-heading {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 0;
    }
    .sidebar-header-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .header-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.28rem 0.55rem;
      font-size: 0.76rem;
      font-weight: 500;
      border-radius: var(--radius-xs);
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      text-decoration: none;
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-fast);
    }
    .header-action-btn:hover, .header-action-btn.active {
      background-color: var(--color-warm-peach);
      border-color: var(--color-dark-taupe);
      color: #2E2A26;
    }
    :host-context(html.dark) .header-action-btn:hover,
    :host-context(html.dark) .header-action-btn.active {
      background-color: rgba(255, 219, 187, 0.25);
      color: #FFDBBB;
    }

    /* Inline New Folder Box */
    .new-folder-card {
      background-color: var(--bg-card);
      border: 1px solid var(--color-warm-peach);
      border-radius: var(--radius-sm);
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      box-shadow: var(--shadow-sm);
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .new-folder-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .new-folder-input {
      font-size: 0.85rem;
      padding: 0.4rem 0.6rem;
    }
    .new-folder-actions {
      display: flex;
      gap: 0.4rem;
      justify-content: flex-end;
    }
    .btn-xs {
      padding: 0.25rem 0.6rem;
      font-size: 0.78rem;
      border-radius: var(--radius-xs);
    }

    .search-docs-input {
      font-size: 0.85rem;
      width: 100%;
    }

    /* Course Folders Navigation */
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .folder-group {
      display: flex;
      flex-direction: column;
    }
    .folder-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      padding: 0.45rem 0.6rem;
      border-radius: var(--radius-xs);
      cursor: pointer;
      user-select: none;
      transition: background-color var(--transition-fast), color var(--transition-fast);
      color: var(--text-primary);
    }
    .folder-header-row:hover {
      background-color: var(--bg-surface-tint);
    }
    .folder-header-main {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      min-width: 0;
      flex: 1;
    }
    .chevron-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      color: var(--text-muted);
    }
    .folder-chevron {
      transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .folder-chevron.rotated {
      transform: rotate(90deg);
    }
    .folder-icon-wrap {
      display: flex;
      align-items: center;
      color: var(--color-warm-peach);
      opacity: 0.9;
    }
    :host-context(html:not(.dark)) .folder-icon-wrap {
      color: var(--color-dark-taupe);
    }
    .folder-title {
      font-size: 0.88rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .folder-header-aside {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }
    .folder-count {
      font-size: 0.72rem;
      font-weight: 500;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      background-color: var(--bg-surface-tint);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
    }
    .folder-count.zero-count {
      opacity: 0.55;
    }

    /* Admin inline folder actions */
    .folder-hover-tools {
      display: none;
      align-items: center;
      gap: 0.2rem;
    }
    .folder-header-row:hover .folder-hover-tools {
      display: flex;
    }
    .folder-mini-tool {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-xs);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
      text-decoration: none;
      transition: all var(--transition-fast);
    }
    .folder-mini-tool:hover {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background-color: var(--bg-surface-tint);
    }
    .folder-mini-tool.delete:hover {
      color: #EF4444;
      border-color: rgba(239, 68, 68, 0.4);
      background-color: rgba(239, 68, 68, 0.08);
    }

    /* Folder Nested Notes List */
    .folder-notes-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.18rem;
      padding-left: 0.65rem;
      margin-left: 1.15rem;
      margin-top: 0.2rem;
      margin-bottom: 0.5rem;
      border-left: 1.5px solid var(--border-color);
      animation: fadeIn 0.15s ease-out;
    }
    .note-link {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.42rem 0.6rem;
      border-radius: var(--radius-xs);
      color: var(--text-secondary);
      font-size: 0.88rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      line-height: 1.35;
      font-family: inherit;
    }
    .doc-icon {
      opacity: 0.6;
      flex-shrink: 0;
    }
    .note-title-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .note-link:hover {
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
    }
    .note-link.active {
      background-color: var(--bg-surface-tint);
      color: var(--text-primary);
      font-weight: 500;
      border-left: 2px solid var(--color-dark-taupe);
      padding-left: 0.5rem;
    }
    :host-context(html.dark) .note-link.active {
      border-left-color: #FFDBBB;
    }

    .folder-empty-state {
      padding: 0.4rem 0.6rem;
      font-size: 0.78rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-style: italic;
    }
    .folder-empty-add-btn {
      font-size: 0.76rem;
      color: var(--color-dark-taupe);
      text-decoration: underline;
      font-style: normal;
      cursor: pointer;
    }
    :host-context(html.dark) .folder-empty-add-btn {
      color: #FFDBBB;
    }

    .sidebar-empty-state {
      padding: 1.5rem 0.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    /* Main Docs Content */
    .docs-main-container {
      padding: 2.25rem 3rem 6rem 3rem;
      min-width: 0;
    }
    .docs-inner-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 250px;
      gap: 3.5rem;
      align-items: start;
      max-width: 1250px;
    }
    .doc-note-article {
      min-width: 0;
      max-width: 800px;
    }
    .docs-toc-sidebar {
      width: 250px;
      position: sticky;
      top: 96px;
      align-self: start;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      scrollbar-width: thin;
      padding-left: 1.25rem;
      border-left: 1px solid var(--border-color);
    }
    .mobile-sidebar-toggle {
      display: none;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.8rem;
      border-radius: var(--radius-xs);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      margin-bottom: 1.5rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-family: inherit;
    }
    /* Documentation Breadcrumbs */
    .doc-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      user-select: none;
    }
    .breadcrumb-link {
      color: var(--text-secondary);
      transition: color var(--transition-fast);
      text-decoration: none;
    }
    .breadcrumb-link:hover {
      color: var(--text-primary);
      text-decoration: underline;
    }
    .bc-sep {
      color: var(--border-color);
    }
    .bc-subject {
      color: var(--text-secondary);
    }
    .bc-current {
      color: var(--text-primary);
      font-weight: 500;
    }
    .doc-note-header {
      margin-bottom: 2rem;
    }
    .doc-note-title {
      font-size: 2.85rem;
      line-height: 1.2;
      color: var(--text-primary);
      margin-bottom: 1rem;
      letter-spacing: -0.01em;
    }
    .doc-meta-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.88rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }
    .meta-separator {
      color: var(--border-color);
    }
    .edit-link {
      color: var(--text-secondary);
      text-decoration: underline;
      font-size: 0.85rem;
    }
    .edit-link:hover {
      color: var(--text-primary);
    }
    .delete-btn-text {
      background: none;
      border: none;
      color: #EF4444;
      text-decoration: underline;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
    }
    .delete-btn-text:hover {
      opacity: 0.8;
    }
    .doc-divider {
      height: 1px;
      background-color: var(--border-color);
      margin-bottom: 2.5rem;
    }
    .doc-markdown {
      line-height: 1.8;
      font-size: 1.05rem;
    }
    .docs-pager {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 2.5rem;
      border-top: 1px solid var(--border-color);
      margin-top: 3.5rem;
    }
    .pager-btn {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 1rem 1.35rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background-color: var(--bg-surface);
      cursor: pointer;
      max-width: 320px;
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .pager-btn:hover {
      border-color: var(--border-strong);
      transform: translateY(-2px);
    }
    .pager-next {
      text-align: right;
      margin-left: auto;
    }
    .pager-dir {
      font-size: 0.76rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pager-title {
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .empty-docs {
      padding: 4rem 2rem;
      color: var(--text-muted);
    }

    @media (max-width: 1100px) {
      .docs-inner-grid {
        grid-template-columns: 1fr;
        gap: 1.75rem;
      }
      .docs-toc-sidebar {
        width: 100%;
        position: static;
        max-height: none;
        padding-left: 0;
        border-left: none;
        order: -1;
      }
      .doc-note-article {
        max-width: 100%;
      }
    }
    @media (max-width: 850px) {
      .docs-layout { grid-template-columns: 1fr; }
      .docs-sidebar { display: none; }
      .docs-sidebar.mobile-open {
        display: flex;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }
      .mobile-sidebar-toggle { display: inline-flex; }
      .docs-main-container { padding: 1.5rem; }
      .doc-note-title { font-size: 2.2rem; }
    }
  `]
})
export class AcademicNotesComponent implements OnInit {
  notesService = inject(NotesService);
  markdownService = inject(MarkdownService);
  authService = inject(AuthService);
  ts = inject(TranslationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  searchQuery = signal<string>('');
  selectedNote = signal<AcademicNote | null>(null);
  renderedContent = signal<any>('');
  tocItems = signal<TocItem[]>([]);
  sidebarMobileOpen = signal<boolean>(false);

  // Folder Expand/Collapse State (Subject Name -> boolean)
  expandedFolders = signal<Record<string, boolean>>({});

  // Admin New Folder Inline Form
  showNewFolderForm = signal<boolean>(false);
  newFolderName = '';

  groupedSubjects = () => this.notesService.getGroupedSubjects(this.searchQuery());

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.selectNote(slug, false);
      } else {
        const all = this.notesService.notes();
        if (all.length > 0 && !this.selectedNote()) {
          this.selectNote(all[0].slug, false);
        }
      }
    });
  }

  isFolderExpanded(subject: string): boolean {
    const map = this.expandedFolders();
    // Default to true (expanded) if not explicitly set to false
    return map[subject] !== undefined ? map[subject] : true;
  }

  toggleFolder(subject: string): void {
    const currentState = this.isFolderExpanded(subject);
    this.expandedFolders.update(map => ({
      ...map,
      [subject]: !currentState
    }));
  }

  onCreateSubject(): void {
    const name = this.newFolderName.trim();
    if (!name) return;

    this.notesService.createSubject(name).subscribe({
      next: () => {
        // Expand the newly created folder
        this.expandedFolders.update(map => ({
          ...map,
          [name]: true
        }));
        this.newFolderName = '';
        this.showNewFolderForm.set(false);
      }
    });
  }

  onDeleteSubject(subject: string, count: number): void {
    const msg = count > 0 
      ? `Delete folder "${subject}" and all ${count} lecture note(s) inside it?` 
      : `Delete empty folder "${subject}"?`;

    if (confirm(msg)) {
      this.notesService.deleteSubject(subject).subscribe(() => {
        const current = this.selectedNote();
        if (current && current.subject.toLowerCase() === subject.toLowerCase()) {
          const remaining = this.notesService.notes();
          if (remaining.length > 0) {
            this.selectNote(remaining[0].slug);
          } else {
            this.selectedNote.set(null);
          }
        }
      });
    }
  }

  selectNote(slug: string, updateUrl = true): void {
    const note = this.notesService.getNoteBySlug(slug);
    if (note) {
      this.selectedNote.set(note);
      this.renderedContent.set(this.markdownService.render(note.content));
      this.tocItems.set(this.markdownService.extractToc(note.content));
      this.sidebarMobileOpen.set(false);

      // Automatically expand this note's folder
      this.expandedFolders.update(map => ({
        ...map,
        [note.subject]: true
      }));

      if (updateUrl) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { slug: note.slug },
          queryParamsHandling: 'merge'
        });
      }
    }
  }

  previousNote(): AcademicNote | null {
    const cur = this.selectedNote();
    if (!cur) return null;
    const all = this.notesService.notes();
    const idx = all.findIndex(n => n.id === cur.id);
    return idx > 0 ? all[idx - 1] : null;
  }

  nextNote(): AcademicNote | null {
    const cur = this.selectedNote();
    if (!cur) return null;
    const all = this.notesService.notes();
    const idx = all.findIndex(n => n.id === cur.id);
    return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  }

  onDeleteNote(id: number): void {
    if (confirm('Delete this academic note?')) {
      this.notesService.deleteNote(id).subscribe(() => {
        const remaining = this.notesService.notes();
        if (remaining.length > 0) {
          this.selectNote(remaining[0].slug);
        } else {
          this.selectedNote.set(null);
        }
      });
    }
  }
}
