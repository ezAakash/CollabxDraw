export type Tool =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'pencil'
  | 'text'
  | 'eraser'
  | 'hand';

export interface Point {
  x: number;
  y: number;
}

export interface DrawElement {
  id: string;
  type: Tool;
  points: Point[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  roomId?: number;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface StyleOptions {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
}

// WebSocket message types
export interface WSMessage {
  type: 'join' | 'draw' | 'update' | 'delete';
  payload: any;
}

export interface WSServerMessage {
  type: 'joined' | 'element_created' | 'element_updated' | 'element_deleted';
  payload: any;
}

export interface Room {
  id: number;
  slug: string;
  createAt: string;
  adminId: string;
  admin?: {
    name: string;
    email: string;
  };
}
