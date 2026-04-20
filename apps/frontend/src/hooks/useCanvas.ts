import { useState, useCallback, useRef } from 'react';
import type { DrawElement, Tool, Point, Viewport, StyleOptions } from '../types';
import { drawElement, hitTest } from '../utils/shapes';
import { DEFAULT_STYLE, CANVAS_BG } from '../utils/constants';

export function useCanvas() {
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleOptions>({ ...DEFAULT_STYLE });
  const [viewport, setViewport] = useState<Viewport>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  const isDrawing = useRef(false);
  const currentElement = useRef<DrawElement | null>(null);
  const dragStart = useRef<Point | null>(null);
  const panStart = useRef<Point | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      return {
        x: (screenX - viewport.offsetX) / viewport.scale,
        y: (screenY - viewport.offsetY) / viewport.scale,
      };
    },
    [viewport]
  );

 
  const generateId = () =>
    `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


  const renderCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
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

      
      if (currentElement.current) {
        drawElement(ctx, currentElement.current);
      }

   
      if (selectedElementId) {
        const selected = elements.find((e) => e.id === selectedElementId);
        if (selected) {
          drawSelectionBox(ctx, selected);
        }
      }

      ctx.restore();
    },
    [elements, viewport, selectedElementId]
  );

  const drawSelectionBox = (
    ctx: CanvasRenderingContext2D,
    element: DrawElement
  ) => {
    const pts = element.points;
    if (pts.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const pad = 6;
    ctx.save();
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
      minX - pad,
      minY - pad,
      maxX - minX + pad * 2,
      maxY - minY + pad * 2
    );
    ctx.setLineDash([]);

   
    const handleSize = 6;
    ctx.fillStyle = '#6c5ce7';
    const corners = [
      { x: minX - pad, y: minY - pad },
      { x: maxX + pad, y: minY - pad },
      { x: minX - pad, y: maxY + pad },
      { x: maxX + pad, y: maxY + pad },
    ];
    for (const c of corners) {
      ctx.fillRect(
        c.x - handleSize / 2,
        c.y - handleSize / 2,
        handleSize,
        handleSize
      );
    }
    ctx.restore();
  };

  
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPoint = screenToCanvas(screenX, screenY);

      if (activeTool === 'hand' || e.button === 1) {
        panStart.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (activeTool === 'select') {
       
        let found = false;
        for (let i = elements.length - 1; i >= 0; i--) {
          if (hitTest(canvasPoint, elements[i])) {
            setSelectedElementId(elements[i].id);
            dragStart.current = canvasPoint;
            found = true;
            break;
          }
        }
        if (!found) {
          setSelectedElementId(null);
        }
        return;
      }

      if (activeTool === 'eraser') {
        for (let i = elements.length - 1; i >= 0; i--) {
          if (hitTest(canvasPoint, elements[i])) {
            const id = elements[i].id;
            setElements((prev) => prev.filter((el) => el.id !== id));
            return id; 
          }
        }
        return;
      }

      if (activeTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          const newElement: DrawElement = {
            id: generateId(),
            type: 'text',
            points: [canvasPoint],
            strokeColor: style.strokeColor,
            fillColor: style.fillColor,
            strokeWidth: style.strokeWidth,
            opacity: style.opacity,
            text,
          };
          setElements((prev) => [...prev, newElement]);
          return newElement;
        }
        return;
      }

      
      isDrawing.current = true;
      const newElement: DrawElement = {
        id: generateId(),
        type: activeTool,
        points: [canvasPoint],
        strokeColor: style.strokeColor,
        fillColor: style.fillColor,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
      };
      currentElement.current = newElement;
      canvas.setPointerCapture(e.pointerId);
    },
    [activeTool, elements, screenToCanvas, style]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPoint = screenToCanvas(screenX, screenY);

      if (panStart.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        panStart.current = { x: e.clientX, y: e.clientY };
        setViewport((v) => ({
          ...v,
          offsetX: v.offsetX + dx,
          offsetY: v.offsetY + dy,
        }));
        return;
      }

      
      if (dragStart.current && selectedElementId) {
        const dx = canvasPoint.x - dragStart.current.x;
        const dy = canvasPoint.y - dragStart.current.y;
        dragStart.current = canvasPoint;
        setElements((prev) =>
          prev.map((el) =>
            el.id === selectedElementId
              ? {
                  ...el,
                  points: el.points.map((p) => ({
                    x: p.x + dx,
                    y: p.y + dy,
                  })),
                }
              : el
          )
        );
        return;
      }

      if (!isDrawing.current || !currentElement.current) return;

      if (currentElement.current.type === 'pencil') {
        currentElement.current = {
          ...currentElement.current,
          points: [...currentElement.current.points, canvasPoint],
        };
      } else {
        
        currentElement.current = {
          ...currentElement.current,
          points: [currentElement.current.points[0], canvasPoint],
        };
      }

      if (canvasRef.current) {
        renderCanvas(canvasRef.current);
      }
    },
    [screenToCanvas, selectedElementId, renderCanvas]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;

      if (panStart.current) {
        panStart.current = null;
        canvas.style.cursor =
          activeTool === 'hand' ? 'grab' : 'crosshair';
        return;
      }

      if (dragStart.current) {
        dragStart.current = null;
        // return the updated element for WS sync
        const updatedEl = elements.find((e) => e.id === selectedElementId);
        return updatedEl;
      }

      if (!isDrawing.current || !currentElement.current) return;

      isDrawing.current = false;
      const finishedElement = { ...currentElement.current };
      currentElement.current = null;

      
      if (finishedElement.points.length >= 2 || finishedElement.type === 'pencil') {
        setElements((prev) => [...prev, finishedElement]);
        return finishedElement;
      }
      return null;
    },
    [activeTool, elements, selectedElementId]
  );

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport((v) => {
      const newScale = Math.min(Math.max(v.scale * delta, 0.1), 5);
      // Zoom toward cursor
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaleChange = newScale / v.scale;
      return {
        scale: newScale,
        offsetX: mouseX - (mouseX - v.offsetX) * scaleChange,
        offsetY: mouseY - (mouseY - v.offsetY) * scaleChange,
      };
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedElementId) return null;
    const id = selectedElementId;
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId(null);
    return id;
  }, [selectedElementId]);

  return {
    elements,
    setElements,
    activeTool,
    setActiveTool,
    selectedElementId,
    setSelectedElementId,
    style,
    setStyle,
    viewport,
    setViewport,
    canvasRef,
    renderCanvas,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    deleteSelected,
  };
}
