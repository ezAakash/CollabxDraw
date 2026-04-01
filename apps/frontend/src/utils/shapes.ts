import type { DrawElement, Point } from '../types';

// ── Shape Rendering ──────────────────────────────────────

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: DrawElement
): void {
  ctx.save();
  ctx.globalAlpha = element.opacity;
  ctx.strokeStyle = element.strokeColor;
  ctx.fillStyle = element.fillColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const { points, type } = element;

  switch (type) {
    case 'rectangle':
      drawRectangle(ctx, points, element.fillColor);
      break;
    case 'ellipse':
      drawEllipse(ctx, points, element.fillColor);
      break;
    case 'diamond':
      drawDiamond(ctx, points, element.fillColor);
      break;
    case 'line':
      drawLine(ctx, points);
      break;
    case 'arrow':
      drawArrow(ctx, points);
      break;
    case 'pencil':
      drawPencil(ctx, points);
      break;
    case 'text':
      drawText(ctx, element);
      break;
    default:
      break;
  }

  ctx.restore();
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fillColor: string
): void {
  if (points.length < 2) return;
  const [start, end] = [points[0], points[points.length - 1]];
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);

  if (fillColor && fillColor !== 'transparent') {
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeRect(x, y, w, h);
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fillColor: string
): void {
  if (points.length < 2) return;
  const [start, end] = [points[0], points[points.length - 1]];
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.abs(end.x - start.x) / 2;
  const ry = Math.abs(end.y - start.y) / 2;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (fillColor && fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fillColor: string
): void {
  if (points.length < 2) return;
  const [start, end] = [points[0], points[points.length - 1]];
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const hw = Math.abs(end.x - start.x) / 2;
  const hh = Math.abs(end.y - start.y) / 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  if (fillColor && fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;
  const start = points[0];
  const end = points[points.length - 1];

  // Draw line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLen = 16;
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle - Math.PI / 6),
    end.y - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle + Math.PI / 6),
    end.y - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawPencil(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Use quadratic curves for smooth freehand lines
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  // Draw to the last point
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, element: DrawElement): void {
  if (!element.text || element.points.length === 0) return;
  const pos = element.points[0];
  ctx.font = `${element.strokeWidth * 8}px 'Inter', sans-serif`;
  ctx.fillStyle = element.strokeColor;
  ctx.textBaseline = 'top';
  ctx.fillText(element.text, pos.x, pos.y);
}

// ── Hit Testing ──────────────────────────────────────────

export function hitTest(point: Point, element: DrawElement): boolean {
  const threshold = element.strokeWidth + 4;
  const { points, type } = element;

  if (points.length < 1) return false;

  switch (type) {
    case 'rectangle':
      return hitTestRectangle(point, points, threshold);
    case 'ellipse':
      return hitTestEllipse(point, points, threshold);
    case 'diamond':
      return hitTestDiamond(point, points, threshold);
    case 'line':
    case 'arrow':
      return hitTestLine(point, points, threshold);
    case 'pencil':
      return hitTestPencil(point, points, threshold);
    case 'text':
      return hitTestText(point, element);
    default:
      return false;
  }
}

function hitTestRectangle(
  point: Point,
  pts: Point[],
  threshold: number
): boolean {
  if (pts.length < 2) return false;
  const [start, end] = [pts[0], pts[pts.length - 1]];
  const x = Math.min(start.x, end.x) - threshold;
  const y = Math.min(start.y, end.y) - threshold;
  const w = Math.abs(end.x - start.x) + threshold * 2;
  const h = Math.abs(end.y - start.y) + threshold * 2;
  return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
}

function hitTestEllipse(
  point: Point,
  pts: Point[],
  threshold: number
): boolean {
  if (pts.length < 2) return false;
  const [start, end] = [pts[0], pts[pts.length - 1]];
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.abs(end.x - start.x) / 2 + threshold;
  const ry = Math.abs(end.y - start.y) / 2 + threshold;
  const dx = point.x - cx;
  const dy = point.y - cy;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

function hitTestDiamond(
  point: Point,
  pts: Point[],
  threshold: number
): boolean {
  // Use bounding box for simplicity
  return hitTestRectangle(point, pts, threshold);
}

function hitTestLine(
  point: Point,
  pts: Point[],
  threshold: number
): boolean {
  if (pts.length < 2) return false;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  return distanceToLine(point, a, b) <= threshold;
}

function hitTestPencil(
  point: Point,
  pts: Point[],
  threshold: number
): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    if (distanceToLine(point, pts[i], pts[i + 1]) <= threshold) {
      return true;
    }
  }
  return false;
}

function hitTestText(point: Point, element: DrawElement): boolean {
  if (!element.text || element.points.length === 0) return false;
  const pos = element.points[0];
  const fontSize = element.strokeWidth * 8;
  const width = element.text.length * fontSize * 0.6;
  return (
    point.x >= pos.x &&
    point.x <= pos.x + width &&
    point.y >= pos.y &&
    point.y <= pos.y + fontSize
  );
}

function distanceToLine(p: Point, a: Point, b: Point): number {
  const lenSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (lenSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);

  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * (b.x - a.x);
  const projY = a.y + t * (b.y - a.y);
  return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

// ── Bounding Box ─────────────────────────────────────────

export function getBoundingBox(element: DrawElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { points } = element;
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
