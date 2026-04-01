import type { Tool } from '../types';
import { TOOLS } from '../utils/constants';
import './Toolbar.css';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export default function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="toolbar" id="drawing-toolbar">
      {TOOLS.map((t) => (
        <button
          key={t.tool}
          className={`toolbar-btn ${activeTool === t.tool ? 'active' : ''}`}
          onClick={() => onToolChange(t.tool)}
          title={`${t.label} (${t.shortcut})`}
          id={`tool-${t.tool}`}
        >
          <span className="toolbar-icon">{t.icon}</span>
          <span className="toolbar-shortcut">{t.shortcut}</span>
        </button>
      ))}
    </div>
  );
}
