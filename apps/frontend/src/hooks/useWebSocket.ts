import { useRef, useCallback, useEffect } from 'react';
import type { DrawElement } from '../types';
import { WS_URL } from '../utils/constants';

interface UseWebSocketOptions {
  roomId: string;
  password?: string;
  token: string | null;
  onElementCreated: (element: DrawElement) => void;
  onElementUpdated: (element: DrawElement) => void;
  onElementDeleted: (elementId: string) => void;
  onJoined: (elements: DrawElement[]) => void;
  onError?: (message: string) => void;
}

export function useWebSocket({
  roomId,
  password,
  token,
  onElementCreated,
  onElementUpdated,
  onElementDeleted,
  onJoined,
  onError
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!token || !roomId || !password) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        payload: { roomId, password }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'error':
            if (onError) onError(message.payload.message || 'Unknown error');
            break;
          case 'joined':
            onJoined(message.payload.elements || []);
            break;
          case 'element_created':
            onElementCreated(message.payload.element);
            break;
          case 'element_updated':
            onElementUpdated(message.payload.element);
            break;
          case 'element_deleted':
            onElementDeleted(message.payload.elementId);
            break;
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('WS error:', err);
      ws.close();
    };
  }, [token, roomId, onElementCreated, onElementUpdated, onElementDeleted, onJoined]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const sendDraw = useCallback((element: DrawElement) => {
    wsRef.current?.send(JSON.stringify({
      type: 'draw',
      payload: { element }
    }));
  }, []);

  const sendUpdate = useCallback((elementId: string, updates: Partial<DrawElement>) => {
    wsRef.current?.send(JSON.stringify({
      type: 'update',
      payload: { elementId, updates }
    }));
  }, []);

  const sendDelete = useCallback((elementId: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'delete',
      payload: { elementId }
    }));
  }, []);

  return { sendDraw, sendUpdate, sendDelete };
}
