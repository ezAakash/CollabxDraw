import { useEffect, useRef, useCallback } from 'react';
import type { DrawElement, Tool, Viewport } from '../types';
import { drawElement } from '../utils/shapes';
import { CANVAS_BG } from '../utils/constants';
import './Canvas.css';

interface CanvasProps {
  elements: DrawElement[];
  viewport: Viewport;
  currentElement: DrawElement | null;
  selectedElementId: string | null;
  activeTool: Tool;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function Canvas({
  elements,
  viewport,
  currentElement,
  selectedElementId,
  activeTool,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  canvasRef,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

    
    const gridSize = 20;
    const startX =
      Math.floor(-viewport.offsetX / viewport.scale / gridSize) * gridSize;
    const startY =
      Math.floor(-viewport.offsetY / viewport.scale / gridSize) * gridSize;
    const endX =
      Math.ceil(
        (canvas.clientWidth - viewport.offsetX) / viewport.scale / gridSize
      ) * gridSize;
    const endY =
      Math.ceil(
        (canvas.clientHeight - viewport.offsetY) / viewport.scale / gridSize
      ) * gridSize;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    
    for (const el of elements) {
      drawElement(ctx, el);
    }

    
    if (currentElement) {
      drawElement(ctx, currentElement);
    }

    
    if (selectedElementId) {
      const selected = elements.find((e) => e.id === selectedElementId);
      if (selected && selected.points.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of selected.points) {
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
  }, [elements, viewport, currentElement, selectedElementId, canvasRef]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  const getCursor = () => {
    switch (activeTool) {
      case 'hand':
        return 'grab';
      case 'select':
        return 'default';
      case 'text':
        return 'text';
      case 'eraser':
        return 'not-allowed';
      default:
        return 'crosshair';
    }
  };

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        id="main-canvas"
        style={{ cursor: getCursor() }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    </div>
  );
}
