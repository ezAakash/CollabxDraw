import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { DrawElement, Tool, Point, StyleOptions } from '../types';
import { DEFAULT_STYLE } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useHistory } from '../hooks/useHistory';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCanvas } from '../hooks/useCanvas';
import Toolbar from '../components/Toolbar';
import StylePanel from '../components/StylePanel';
import Canvas from '../components/Canvas';
import type { CanvasHandle } from '../components/Canvas';
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
  
  const [editingText, setEditingText] = useState<{ pt: Point; text: string } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Participants state
  const [participants, setParticipants] = useState<string[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasComponentRef = useRef<CanvasHandle>(null);

  const { pushState, undo, redo } = useHistory(setElements);

  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    onParticipantUpdate: useCallback((names: string[], _count: number) => {
      setParticipants(names);
    }, []),
    onError: useCallback((message: string) => {
      alert(`Room Connection Failed: ${message}`);
      navigate('/dashboard', { replace: true });
    }, [navigate]),
  });

  const {
    viewport,
    currentEl,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel
  } = useCanvas({
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
    canvasRef,
    canvasComponentRef
  });

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
      setTimeout(() => textInputRef.current?.focus(), 10);
    }
  }, [editingText !== null]);

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

  const handleDownloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `canvas-${roomId || 'drawing'}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [roomId]);

  const handleLeaveRoom = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="canvas-page" id="canvas-page">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
      <StylePanel style={style} onStyleChange={setStyle} />

      <Canvas
        ref={canvasComponentRef}
        canvasRef={canvasRef}
        elements={elements}
        viewport={viewport}
        currentEl={currentEl}
        selectedId={selectedId}
        editingText={editingText}
        style={style}
        activeTool={activeTool}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

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
            color: 'transparent',
            opacity: style.opacity,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            minWidth: '100px',
            transform: 'translateY(-50%)',
            zIndex: 10,
            caretColor: '#6c5ce7',
          }}
        />
      )}

      <div className="canvas-hud">
        <div className="participants-widget" id="participants-widget">
          <button
            className="participants-badge"
            onClick={() => setShowParticipants((s) => !s)}
            id="participants-btn"
            title="Show participants"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="participants-count">{participants.length || 1}</span>
          </button>

          {showParticipants && (
            <div className="participants-popover" id="participants-popover">
              <div className="participants-popover-header">
                <span>In this room</span>
                <button
                  className="participants-popover-close"
                  onClick={() => setShowParticipants(false)}
                  aria-label="Close"
                >×</button>
              </div>
              <ul className="participants-list">
                {participants.length > 0 ? participants.map((name, i) => (
                  <li key={i} className="participants-item">
                    <span className="participant-avatar">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="participant-name">{name}</span>
                  </li>
                )) : (
                  <li className="participants-item participants-empty">Only you</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          className="canvas-action-btn"
          onClick={handleDownloadPNG}
          id="download-canvas-btn"
          title="Download canvas as PNG"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export</span>
        </button>

        <button
          className="canvas-action-btn"
          onClick={handleLeaveRoom}
          id="leave-room-btn"
          title="Leave Room"
          style={{ color: '#ff6b6b' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Leave</span>
        </button>
      </div>

      <div className="zoom-indicator">
        {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  );
}
