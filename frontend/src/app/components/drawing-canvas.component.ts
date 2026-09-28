import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

type ToolType = 'pen' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'eraser';

@Component({
  selector: 'app-drawing-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-panel">
      <!-- Toolbar Header -->
      <div class="canvas-header">
        <div class="canvas-title-group">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          <span class="canvas-title">{{ ts.t('drawing.title') }}</span>
          <span class="badge badge-peach">{{ ts.t('drawing.badge') }}</span>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-sm btn-secondary" (click)="undo()" [disabled]="historyIndex <= 0" [title]="ts.t('drawing.undo')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button type="button" class="btn btn-sm btn-secondary" (click)="clearCanvas()" [title]="ts.t('drawing.clear')">{{ ts.t('drawing.clear') }}</button>
          <button type="button" class="btn btn-sm btn-primary" (click)="insertIntoMarkdown()" [title]="ts.t('drawing.insert_note')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span>{{ ts.t('drawing.insert_note') }}</span>
          </button>
          <button type="button" class="close-canvas-btn" (click)="close.emit()" [title]="ts.t('drawing.close')">✕</button>
        </div>
      </div>

      <!-- Controls Row: Tools, Strokes, Colors -->
      <div class="canvas-controls">
        <div class="tools-group">
          <button type="button" class="tool-btn" [class.active]="selectedTool === 'pen'" (click)="setTool('pen')" [title]="ts.t('drawing.tool_pen')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
          </button>
          <button type="button" class="tool-btn" [class.active]="selectedTool === 'rect'" (click)="setTool('rect')" [title]="ts.t('drawing.tool_rect')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
          </button>
          <button type="button" class="tool-btn" [class.active]="selectedTool === 'circle'" (click)="setTool('circle')" [title]="ts.t('drawing.tool_circle')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
          </button>
          <button type="button" class="tool-btn" [class.active]="selectedTool === 'arrow'" (click)="setTool('arrow')" [title]="ts.t('drawing.tool_arrow')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <button type="button" class="tool-btn" [class.active]="selectedTool === 'line'" (click)="setTool('line')" [title]="ts.t('drawing.tool_line')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="20" x2="20" y2="4"/></svg>
          </button>
          <button type="button" class="tool-btn" [class.active]="selectedTool === 'text'" (click)="setTool('text')" [title]="ts.t('drawing.tool_text')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          </button>
          <button type="button" class="tool-btn" [class.active]="selectedTool === 'eraser'" (click)="setTool('eraser')" [title]="ts.t('drawing.tool_eraser')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"/><line x1="18" y1="14" x2="7" y2="14"/></svg>
          </button>
        </div>

        <div class="divider"></div>

        <!-- Color Presets -->
        <div class="color-palette">
          @for (c of palette; track c) {
            <button 
              type="button" 
              class="color-dot" 
              [style.background-color]="c" 
              [class.active]="strokeColor === c"
              (click)="strokeColor = c" 
              [title]="c">
            </button>
          }
        </div>

        <div class="divider"></div>

        <!-- Stroke Width -->
        <div class="stroke-group">
          <button type="button" class="stroke-btn" [class.active]="lineWidth === 2" (click)="lineWidth = 2" [title]="ts.t('drawing.stroke_thin')">
            <span class="stroke-line" style="height: 2px;"></span>
          </button>
          <button type="button" class="stroke-btn" [class.active]="lineWidth === 4" (click)="lineWidth = 4" [title]="ts.t('drawing.stroke_medium')">
            <span class="stroke-line" style="height: 4px;"></span>
          </button>
          <button type="button" class="stroke-btn" [class.active]="lineWidth === 7" (click)="lineWidth = 7" [title]="ts.t('drawing.stroke_thick')">
            <span class="stroke-line" style="height: 7px;"></span>
          </button>
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="canvas-viewport" #containerRef>
        <canvas 
          #canvasRef 
          (mousedown)="onMouseDown($event)"
          (mousemove)="onMouseMove($event)"
          (mouseup)="onMouseUp($event)"
          (mouseleave)="onMouseUp($event)"
          class="drawing-surface"
        ></canvas>
      </div>

      <!-- Prompt text modal if text tool is used -->
      @if (textModalOpen()) {
        <div class="text-prompt-box">
          <input 
            #textInputRef
            type="text" 
            placeholder="Type label text and press Enter..." 
            class="input input-sm" 
            (keydown.enter)="applyText(textInputRef.value)"
            (keydown.escape)="cancelText()"
            autofocus
          />
          <button type="button" class="btn btn-sm btn-primary" (click)="applyText(textInputRef.value)">Add</button>
          <button type="button" class="btn btn-sm btn-secondary" (click)="cancelText()">Cancel</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .canvas-panel {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-md);
      position: relative;
    }
    .canvas-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-card-secondary);
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .canvas-title-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .canvas-title {
      font-family: var(--font-heading);
      font-size: 1.15rem;
      color: var(--text-primary);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .close-canvas-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .close-canvas-btn:hover {
      color: var(--text-primary);
    }
    .canvas-controls {
      display: flex;
      align-items: center;
      padding: 0.65rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      gap: 1rem;
      flex-wrap: wrap;
      background-color: var(--bg-card);
    }
    .tools-group, .stroke-group {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .tool-btn, .stroke-btn {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tool-btn:hover, .stroke-btn:hover {
      background-color: var(--bg-card-hover);
      color: var(--text-primary);
    }
    .tool-btn.active, .stroke-btn.active {
      background-color: var(--bg-tint-peach);
      border-color: var(--color-warm-peach);
      color: #2E2A26;
    }
    .divider {
      width: 1px;
      height: 24px;
      background-color: var(--border-color);
    }
    .color-palette {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .color-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform var(--transition-fast);
    }
    .color-dot.active {
      transform: scale(1.25);
      border-color: var(--text-primary);
    }
    .stroke-line {
      width: 16px;
      background-color: currentColor;
      border-radius: 2px;
      display: block;
    }
    .canvas-viewport {
      width: 100%;
      height: 420px;
      overflow: hidden;
      background-color: #FAF5EE; /* Architectural sketch paper tint */
      position: relative;
      cursor: crosshair;
    }
    :host-context(html.dark) .canvas-viewport {
      background-color: #23201D;
    }
    .drawing-surface {
      display: block;
      width: 100%;
      height: 100%;
    }
    .text-prompt-box {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      z-index: 10;
    }
  `]
})
export class DrawingCanvasComponent implements AfterViewInit {
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;

  @Output() insertSnippet = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  ts = inject(TranslationService);

  selectedTool: ToolType = 'pen';
  strokeColor = '#2E2A26';
  lineWidth = 3;

  palette = [
    '#2E2A26', // Deep charcoal
    '#E08E58', // Warm peach accent
    '#A8988A', // Warm taupe
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444'  // Red
  ];

  textModalOpen = signal<boolean>(false);
  private textPos = { x: 0, y: 0 };

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private snapshot!: ImageData;

  history: ImageData[] = [];
  historyIndex = -1;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    
    // Set actual canvas size to match container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.saveState();
  }

  setTool(tool: ToolType): void {
    this.selectedTool = tool;
  }

  private saveState(): void {
    if (!this.ctx) return;
    const imgData = this.ctx.getImageData(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    // Truncate redo tree if we branched
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(imgData);
    this.historyIndex++;
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      this.ctx.putImageData(state, 0, 0);
    }
  }

  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.saveState();
  }

  onMouseDown(e: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.isDrawing = true;

    this.snapshot = this.ctx.getImageData(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);

    if (this.selectedTool === 'text') {
      this.textPos = { x: this.startX, y: this.startY };
      this.textModalOpen.set(true);
      this.isDrawing = false;
      return;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this.startX, this.startY);
    this.setupContext();
  }

  onMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (this.selectedTool === 'pen') {
      this.ctx.lineTo(currentX, currentY);
      this.ctx.stroke();
    } else if (this.selectedTool === 'eraser') {
      this.ctx.clearRect(currentX - 12, currentY - 12, 24, 24);
    } else {
      // Shape tools: restore snapshot first
      this.ctx.putImageData(this.snapshot, 0, 0);
      this.setupContext();

      if (this.selectedTool === 'rect') {
        const w = currentX - this.startX;
        const h = currentY - this.startY;
        this.ctx.strokeRect(this.startX, this.startY, w, h);
      } else if (this.selectedTool === 'circle') {
        const radiusX = Math.abs(currentX - this.startX) / 2;
        const radiusY = Math.abs(currentY - this.startY) / 2;
        const centerX = this.startX + (currentX - this.startX) / 2;
        const centerY = this.startY + (currentY - this.startY) / 2;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
      } else if (this.selectedTool === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
      } else if (this.selectedTool === 'arrow') {
        this.drawArrow(this.startX, this.startY, currentX, currentY);
      }
    }
  }

  onMouseUp(e: MouseEvent): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.saveState();
  }

  private setupContext(): void {
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.fillStyle = this.strokeColor;
    this.ctx.lineWidth = this.lineWidth;
  }

  private drawArrow(fromX: number, fromY: number, toX: number, toY: number): void {
    const headlen = 14;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    // Arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();
  }

  applyText(text: string): void {
    if (text && text.trim()) {
      this.ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      this.ctx.fillStyle = this.strokeColor;
      this.ctx.fillText(text.trim(), this.textPos.x, this.textPos.y);
      this.saveState();
    }
    this.textModalOpen.set(false);
  }

  cancelText(): void {
    this.textModalOpen.set(false);
  }

  insertIntoMarkdown(): void {
    const canvas = this.canvasRef.nativeElement;
    // Export clean PNG
    const dataUrl = canvas.toDataURL('image/png');
    const markdownSnippet = `\n\n![Architecture Sketch / Note Diagram](${dataUrl})\n\n`;
    this.insertSnippet.emit(markdownSnippet);
  }
}
