import { useState, useCallback, useRef } from 'react';
import type { DrawElement, Tool, Point, StyleOptions } from '../types';
import { hitTest } from '../utils/shapes';
import type { CanvasHandle } from '../components/Canvas';

interface UseCanvasProps {
  elements: DrawElement[];
  setElements: React.Dispatch<React.SetStateAction<DrawElement[]>>;
  activeTool: Tool;
  style: StyleOptions;
  sendDraw: (el: DrawElement) => void;
  sendDelete: (id: string) => void;
  pushState: (els: DrawElement[]) => void;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  editingText: { pt: Point; text: string } | null;
  setEditingText: React.Dispatch<React.SetStateAction<{ pt: Point; text: string } | null>>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasComponentRef: React.RefObject<CanvasHandle | null>;
}

export function useCanvas({
  elements,
  setElements,
  activeTool,
  style,
  sendDraw,
  sendDelete,
  pushState,
  selectedId,
  setSelectedId,
  editingText,
  setEditingText,
  canvasComponentRef
}: UseCanvasProps) {
  const [viewport, setViewport] = useState({ offsetX: 0, offsetY: 0, scale: 1 });
  const isDrawing = useRef(false);
  const isErasing = useRef(false);
  const currentEl = useRef<DrawElement | null>(null);
  const panStart = useRef<Point | null>(null);
  const dragStart = useRef<Point | null>(null);

  const screenToCanvas = useCallback(
    (sx: number, sy: number): Point => ({
      x: (sx - viewport.offsetX) / viewport.scale,
      y: (sy - viewport.offsetY) / viewport.scale,
    }),
    [viewport]
  );

  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pt = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);

      if (activeTool === 'hand' || e.button === 1) {
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (activeTool === 'select') {
        let found = false;
        for (let i = elements.length - 1; i >= 0; i--) {
          if (hitTest(pt, elements[i])) {
            setSelectedId(elements[i].id);
            dragStart.current = pt;
            found = true;
            break;
          }
        }
        if (!found) setSelectedId(null);
        return;
      }

      if (activeTool === 'eraser') {
        isErasing.current = true;
        pushState(elements);
        const toDelete: string[] = [];
        for (let i = elements.length - 1; i >= 0; i--) {
          if (hitTest(pt, elements[i])) {
            toDelete.push(elements[i].id);
          }
        }
        if (toDelete.length > 0) {
          setElements((prev) => prev.filter((el) => !toDelete.includes(el.id)));
          toDelete.forEach((id) => sendDelete(id));
        }
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      if (activeTool === 'text') {
        if (editingText) return;
        setEditingText({ pt, text: '' });
        return;
      }

      pushState(elements);
      isDrawing.current = true;
      currentEl.current = {
        id: generateId(),
        type: activeTool,
        points: [pt],
        strokeColor: style.strokeColor,
        fillColor: style.fillColor,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [activeTool, elements, screenToCanvas, style, pushState, sendDelete, editingText, setSelectedId, setEditingText, setElements]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pt = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);

      if (panStart.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        panStart.current = { x: e.clientX, y: e.clientY };
        setViewport((v) => ({ ...v, offsetX: v.offsetX + dx, offsetY: v.offsetY + dy }));
        return;
      }

      if (isErasing.current) {
        setElements((prev) => {
          const toDelete: string[] = [];
          for (let i = prev.length - 1; i >= 0; i--) {
            if (hitTest(pt, prev[i])) {
              toDelete.push(prev[i].id);
            }
          }
          if (toDelete.length === 0) return prev;
          toDelete.forEach((id) => sendDelete(id));
          return prev.filter((el) => !toDelete.includes(el.id));
        });
        return;
      }

      if (dragStart.current && selectedId) {
        const dx = pt.x - dragStart.current.x;
        const dy = pt.y - dragStart.current.y;
        dragStart.current = pt;
        setElements((prev) =>
          prev.map((el) =>
            el.id === selectedId
              ? { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
              : el
          )
        );
        return;
      }

      if (!isDrawing.current || !currentEl.current) return;

      if (currentEl.current.type === 'pencil') {
        currentEl.current = {
          ...currentEl.current,
          points: [...currentEl.current.points, pt],
        };
      } else {
        currentEl.current = {
          ...currentEl.current,
          points: [currentEl.current.points[0], pt],
        };
      }
      
      canvasComponentRef.current?.render();
    },
    [screenToCanvas, selectedId, sendDelete, setElements, canvasComponentRef]
  );

  const handlePointerUp = useCallback(
    () => {
      if (panStart.current) {
        panStart.current = null;
        return;
      }
      if (isErasing.current) {
        isErasing.current = false;
        return;
      }
      if (dragStart.current) {
        dragStart.current = null;
        return;
      }
      if (!isDrawing.current || !currentEl.current) return;

      isDrawing.current = false;
      const finished = { ...currentEl.current };
      currentEl.current = null;

      if (finished.points.length >= 2) {
        setElements((prev) => [...prev, finished]);
        sendDraw(finished);
      }
    },
    [sendDraw, setElements]
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setViewport((v) => {
      const ns = Math.min(Math.max(v.scale * delta, 0.1), 5);
      const sc = ns / v.scale;
      return { scale: ns, offsetX: mx - (mx - v.offsetX) * sc, offsetY: my - (my - v.offsetY) * sc };
    });
  }, []);

  return {
    viewport,
    currentEl,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel
  };
}
