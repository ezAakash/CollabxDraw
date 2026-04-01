import { COLOR_PALETTE } from '../utils/constants';
import './StylePanel.css';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ label, color, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker">
      <label className="style-label">{label}</label>
      <div className="color-swatches">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            className={`color-swatch ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
        {label === 'Fill' && (
          <button
            className={`color-swatch transparent-swatch ${color === 'transparent' ? 'active' : ''}`}
            onClick={() => onChange('transparent')}
            title="Transparent"
          >
            ∅
          </button>
        )}
      </div>
    </div>
  );
}
