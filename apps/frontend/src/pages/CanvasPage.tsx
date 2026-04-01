import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { DrawElement, Tool, Point, StyleOptions } from '../types';
import { drawElement as renderElement, hitTest } from '../utils/shapes';
import { DEFAULT_STYLE, CANVAS_BG } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useHistory } from '../hooks/useHistory';
import { useKeyboard } from '../hooks/useKeyboard';
import Toolbar from '../components/Toolbar';
import StylePanel from '../components/StylePanel';
import './CanvasPage.css';

export default function CanvasPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const password = location.state?.password;

  useEffect(() => {
    if (!password) {
      alert('Password required to join room. Please join via dashboard.');
      navigate('/dashboard', { replace: true });
    }
  }, [password, navigate]);

  const [elements, setElements] = useState<DrawElement[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleOptions>({ ...DEFAULT_STYLE });
  const [viewport, setViewport] = useState({ offsetX: 0, offsetY: 0, scale: 1 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentEl = useRef<DrawElement | null>(null);
  const panStart = useRef<Point | null>(null);
  const dragStart = useRef<Point | null>(null);

  const { pushState, undo, redo } = useHistory(setElements);


  // WebSocket
  const { sendDraw, sendDelete } = useWebSocket({
    roomId: roomId || '',
    password,
    token,
    onElementCreated: useCallback((el: DrawElement) => {
      setElements((prev) => [...prev, el]);
    }, []),
    onElementUpdated: useCallback((el: DrawElement) => {
      setElements((prev) => prev.map((e) => (e.id === el.id ? el : e)));
    }, []),
    onElementDeleted: useCallback((id: string) => {
      setElements((prev) => prev.filter((e) => e.id !== id));
    }, []),
    onJoined: useCallback((els: DrawElement[]) => {
      setElements(els);
    }, []),
    onError: useCallback((message: string) => {
      alert(`Room Connection Failed: ${message}`);
      navigate('/dashboard', { replace: true });
    }, [navigate]),
  });

  const [editingText, setEditingText] = useState<{
    pt: Point;
    text: string;
  } | null>(null);

  const textInputRef = useRef<HTMLInputElement>(null);

  const finalizeText = useCallback(() => {
    if (!editingText) return;
    if (editingText.text.trim()) {
      pushState(elements);
      const newEl: DrawElement = {
        id: generateId(),
        type: 'text',
        points: [editingText.pt],
        strokeColor: style.strokeColor,
        fillColor: 'transparent',
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
        text: editingText.text.trim(),
      };
      setElements((prev) => [...prev, newEl]);
      sendDraw(newEl);
    }
    setEditingText(null);
  }, [editingText, elements, style, pushState, sendDraw]);

  useEffect(() => {
    if (editingText && textInputRef.current) {
      // Small timeout ensures the DOM has fully rendered the element
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 10);
    }
  }, [editingText !== null]); // Focus only when editingText changes from null to object

  // Helper functions
  const screenToCanvas = useCallback(
    (sx: number, sy: number): Point => ({
      x: (sx - viewport.offsetX) / viewport.scale,
      y: (sy - viewport.offsetY) / viewport.scale,
    }),
    [viewport]
  );

  const generateId = () =>
    `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // ── Render ──────────────────────────────────────
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
  }, [elements, viewport, selectedId, editingText, style]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    const h = () => render();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [render]);

  // ── Pointer Handlers ───────────────────────────
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
        for (let i = elements.length - 1; i >= 0; i--) {
          if (hitTest(pt, elements[i])) {
            pushState(elements);
            const id = elements[i].id;
            setElements((prev) => prev.filter((el) => el.id !== id));
            sendDelete(id);
            break;
          }
        }
        return;
      }

      if (activeTool === 'text') {
        if (editingText) {
          // Let the native onBlur event handle the finalization when clicking elsewhere
          return;
        }
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
    [activeTool, elements, screenToCanvas, style, pushState, sendDelete, sendDraw]
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
      render();
    },
    [screenToCanvas, selectedId, render]
  );

  const handlePointerUp = useCallback(
    () => {
      if (panStart.current) {
        panStart.current = null;
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
    [sendDraw]
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

  // Keyboard
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    pushState(elements);
    setElements((prev) => prev.filter((e) => e.id !== selectedId));
    sendDelete(selectedId);
    setSelectedId(null);
  }, [selectedId, elements, pushState, sendDelete]);

  useKeyboard({
    onToolChange: setActiveTool,
    onUndo: () => undo(elements),
    onRedo: () => redo(elements),
    onDelete: handleDelete,
  });

  const getCursor = () => {
    switch (activeTool) {
      case 'hand': return 'grab';
      case 'select': return 'default';
      case 'text': return 'text';
      case 'eraser': return 'not-allowed';
      default: return 'crosshair';
    }
  };

  return (
    <div className="canvas-page" id="canvas-page">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
      <StylePanel style={style} onStyleChange={setStyle} />

      <canvas
        ref={canvasRef}
        className="main-canvas"
        id="main-canvas"
        style={{ cursor: getCursor() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Inline Text Editing Overlay */}
      {editingText && (
        <input
          ref={textInputRef}
          value={editingText.text}
          onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
          onBlur={finalizeText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finalizeText();
            if (e.key === 'Escape') setEditingText(null);
          }}
          style={{
            position: 'absolute',
            left: editingText.pt.x * viewport.scale + viewport.offsetX,
            top: editingText.pt.y * viewport.scale + viewport.offsetY,
            font: `${style.strokeWidth * 8 * viewport.scale}px Inter, sans-serif`,
            color: 'transparent', // The actual character rendering is handled by the canvas!
            opacity: style.opacity,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            caretColor: style.strokeColor,
            width: `${Math.max(1, editingText.text.length) + 2}ch`,
            zIndex: 10
          }}
        />
      )}

      {/* Zoom indicator */}
      <div className="zoom-indicator">
        {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  );
}
