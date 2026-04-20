import type { Tool, StyleOptions } from '../types';

export interface ToolDefinition {
  tool: Tool;
  label: string;
  shortcut: string;
  icon: string;
}

export const TOOLS: ToolDefinition[] = [
  { tool: 'select', label: 'Select', shortcut: 'V', icon: '↖' },
  { tool: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: '□' },
  { tool: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: '○' },
  { tool: 'diamond', label: 'Diamond', shortcut: 'D', icon: '◇' },
  { tool: 'line', label: 'Line', shortcut: 'L', icon: '╱' },
  { tool: 'arrow', label: 'Arrow', shortcut: 'A', icon: '→' },
  { tool: 'pencil', label: 'Pencil', shortcut: 'P', icon: '✏' },
  { tool: 'text', label: 'Text', shortcut: 'T', icon: 'T' },
  { tool: 'eraser', label: 'Eraser', shortcut: 'E', icon: '⌫' },
  { tool: 'hand', label: 'Pan', shortcut: 'H', icon: '✋' },
];

export const SHORTCUT_MAP: Record<string, Tool> = {};
TOOLS.forEach((t) => {
  SHORTCUT_MAP[t.shortcut.toLowerCase()] = t.tool;
});

export const COLOR_PALETTE = [
  '#ffffff',
  '#e8e8ed',
  '#8888a0',
  '#ff6b6b',
  '#ff9f43',
  '#feca57',
  '#51cf66',
  '#20c997',
  '#339af0',
  '#6c5ce7',
  '#cc5de8',
  '#ff6b9d',
];

export const STROKE_WIDTHS = [1, 2, 3, 5, 8];

export const DEFAULT_STYLE: StyleOptions = {
  strokeColor: '#ffffff',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
};

export const CANVAS_BG = '#1a1a2e';

export const API_BASE = import.meta.env.VITE_API_URL;
export const WS_URL = import.meta.env.VITE_WS_URL;