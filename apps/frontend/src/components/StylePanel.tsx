import type { StyleOptions } from '../types';
import { STROKE_WIDTHS } from '../utils/constants';
import ColorPicker from './ColorPicker';
import './StylePanel.css';

interface StylePanelProps {
  style: StyleOptions;
  onStyleChange: (style: StyleOptions) => void;
}

export default function StylePanel({ style, onStyleChange }: StylePanelProps) {
  return (
    <div className="style-panel" id="style-panel">
      <ColorPicker
        label="Stroke"
        color={style.strokeColor}
        onChange={(strokeColor) => onStyleChange({ ...style, strokeColor })}
      />

      <ColorPicker
        label="Fill"
        color={style.fillColor}
        onChange={(fillColor) => onStyleChange({ ...style, fillColor })}
      />

      <div className="style-group">
        <label className="style-label">Stroke Width</label>
        <div className="stroke-widths">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              className={`stroke-btn ${style.strokeWidth === w ? 'active' : ''}`}
              onClick={() => onStyleChange({ ...style, strokeWidth: w })}
              title={`${w}px`}
            >
              <div
                className="stroke-preview"
                style={{ height: Math.min(w, 8), width: '100%' }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="style-group">
        <label className="style-label">
          Opacity: {Math.round(style.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={style.opacity}
          onChange={(e) =>
            onStyleChange({ ...style, opacity: parseFloat(e.target.value) })
          }
          className="opacity-slider"
        />
      </div>
    </div>
  );
}
