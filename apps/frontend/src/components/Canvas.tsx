import { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { DrawElement, Tool, Point, StyleOptions } from '../types';
import { drawElement as renderElement } from '../utils/shapes';
import { CANVAS_BG } from '../utils/constants';

interface CanvasProps {
  elements: DrawElement[];
  viewport: { offsetX: number; offsetY: number; scale: number };
  currentEl: React.RefObject<DrawElement | null>;
  selectedId: string | null;
  editingText: { pt: Point; text: string } | null;
  style: StyleOptions;
  activeTool: Tool;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export interface CanvasHandle {
  render: () => void;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({
  elements,
  viewport,
  currentEl,
  selectedId,
  editingText,
  style,
  activeTool,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  canvasRef
}, ref) => {
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);

    // Grid dots
    const gs = 20;
    const sx = Math.floor(-viewport.offsetX / viewport.scale / gs) * gs;
    const sy = Math.floor(-viewport.offsetY / viewport.scale / gs) * gs;
    const ex = Math.ceil((canvas.clientWidth - viewport.offsetX) / viewport.scale / gs) * gs;
    const ey = Math.ceil((canvas.clientHeight - viewport.offsetY) / viewport.scale / gs) * gs;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = sx; x <= ex; x += gs) {
      for (let y = sy; y <= ey; y += gs) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Elements
    for (const el of elements) {
      renderElement(ctx, el);
    }
    if (currentEl.current) {
      renderElement(ctx, currentEl.current);
    }
    if (editingText && editingText.text) {
      renderElement(ctx, {
        id: 'temp_text',
        type: 'text',
        points: [editingText.pt],
        strokeColor: style.strokeColor,
        fillColor: 'transparent',
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
        text: editingText.text,
      });
    }

    // Selection
    if (selectedId) {
      const sel = elements.find((e) => e.id === selectedId);
      if (sel && sel.points.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of sel.points) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
        const pad = 6;
        ctx.strokeStyle = '#6c5ce7';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
        ctx.setLineDash([]);
        const hs = 6;
        ctx.fillStyle = '#6c5ce7';
        for (const c of [
          { x: minX - pad, y: minY - pad },
          { x: maxX + pad, y: minY - pad },
          { x: minX - pad, y: maxY + pad },
          { x: maxX + pad, y: maxY + pad },
        ]) {
          ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
        }
      }
    }

    ctx.restore();
  }, [elements, viewport, selectedId, editingText, style, currentEl, canvasRef]);

  useImperativeHandle(ref, () => ({ render }));

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    const h = () => render();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [render]);

  const getCursor = () => {
    switch (activeTool) {
      case 'hand': return 'grab';
      case 'select': return 'default';
      case 'text': return 'text';
      case 'eraser': return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="1.5"/></svg>') 12 12, cell`;
      default: return 'crosshair';
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="main-canvas"
      id="main-canvas"
      style={{ cursor: getCursor() }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    />
  );
});

export default Canvas;
