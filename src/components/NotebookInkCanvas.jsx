import { useCallback, useEffect, useRef } from 'react';

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function strokeHitsPoint(stroke, px, py, width, radius = 14) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return false;
  if (pts.length === 1) {
    return Math.hypot(px - pts[0].x * width, py - pts[0].y) <= radius;
  }
  const effectiveRadius =
    stroke.tool === 'highlighter' ? radius + 8 : radius;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const x1 = pts[i].x * width;
    const y1 = pts[i].y;
    const x2 = pts[i + 1].x * width;
    const y2 = pts[i + 1].y;
    if (distToSegment(px, py, x1, y1, x2, y2) <= effectiveRadius) {
      return true;
    }
  }
  return false;
}

function drawStroke(ctx, stroke, width) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color || '#24252A';
  ctx.fillStyle = stroke.color || '#24252A';

  if (stroke.tool === 'highlighter') {
    ctx.globalAlpha = 0.34;
    ctx.globalCompositeOperation = 'multiply';
    ctx.lineWidth = (stroke.size || 3) * 5.2;
  } else {
    ctx.globalAlpha = 0.94;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = stroke.size || 2.5;
  }

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x * width, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x * width, pts[0].y);

  for (let i = 1; i < pts.length - 1; i += 1) {
    const xCurr = pts[i].x * width;
    const yCurr = pts[i].y;
    const xNext = pts[i + 1].x * width;
    const yNext = pts[i + 1].y;
    const midX = (xCurr + xNext) / 2;
    const midY = (yCurr + yNext) / 2;
    ctx.quadraticCurveTo(xCurr, yCurr, midX, midY);
  }

  const last = pts[pts.length - 1];
  ctx.lineTo(last.x * width, last.y);
  ctx.stroke();
  ctx.restore();
}

export function NotebookInkCanvas({
  strokes = [],
  active = false,
  tool = 'pen',
  color = '#24252A',
  strokeSize = 2.4,
  onAddStroke,
  onEraseStart,
  onEraseStrokes,
  onEraseEnd,
}) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const liveStrokeRef = useRef(null);
  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    ctx.clearRect(0, 0, width, height);

    strokes.forEach((stroke) => drawStroke(ctx, stroke, width));
    if (liveStrokeRef.current) {
      drawStroke(ctx, liveStrokeRef.current, width);
    }
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const syncDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      redraw();
    };

    syncDimensions();
    const observer = new ResizeObserver(syncDimensions);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getRelativePoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return null;

    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;
    return {
      cssX,
      cssY,
      normX: Math.max(0, Math.min(1, cssX / rect.width)),
      width: rect.width,
    };
  };

  const handlePointerDown = (event) => {
    if (!active) return;
    if (event.button !== undefined && event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }

    const pt = getRelativePoint(event);
    if (!pt) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (tool === 'eraser') {
      isErasingRef.current = true;
      if (onEraseStart) onEraseStart();
      const hitIds = strokes
        .filter((s) => strokeHitsPoint(s, pt.cssX, pt.cssY, pt.width))
        .map((s) => s.id);
      if (hitIds.length > 0 && onEraseStrokes) {
        onEraseStrokes(hitIds);
      }
      return;
    }

    isDrawingRef.current = true;
    liveStrokeRef.current = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tool,
      color,
      size: strokeSize,
      points: [{ x: pt.normX, y: pt.cssY }],
    };
    redraw();
  };

  const handlePointerMove = (event) => {
    if (!active) return;
    const pt = getRelativePoint(event);
    if (!pt) return;

    if (isErasingRef.current) {
      const hitIds = strokes
        .filter((s) => strokeHitsPoint(s, pt.cssX, pt.cssY, pt.width))
        .map((s) => s.id);
      if (hitIds.length > 0 && onEraseStrokes) {
        onEraseStrokes(hitIds);
      }
      return;
    }

    if (!isDrawingRef.current || !liveStrokeRef.current) return;
    const pts = liveStrokeRef.current.points;
    const last = pts[pts.length - 1];
    if (
      last &&
      Math.hypot((pt.normX - last.x) * pt.width, pt.cssY - last.y) < 1.5
    ) {
      return;
    }
    pts.push({ x: pt.normX, y: pt.cssY });
    redraw();
  };

  const finishPointerAction = () => {
    if (isErasingRef.current) {
      isErasingRef.current = false;
      if (onEraseEnd) onEraseEnd();
      return;
    }
    if (!isDrawingRef.current || !liveStrokeRef.current) return;
    isDrawingRef.current = false;
    const finished = liveStrokeRef.current;
    liveStrokeRef.current = null;
    if (onAddStroke && finished.points.length > 0) {
      onAddStroke(finished);
    }
    redraw();
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerAction}
      onPointerCancel={finishPointerAction}
      className={`absolute inset-0 w-full h-full z-20 ${
        active
          ? tool === 'eraser'
            ? 'pointer-events-auto cursor-cell touch-none'
            : 'pointer-events-auto cursor-crosshair touch-none'
          : 'pointer-events-none'
      }`}
      aria-label={active ? 'Notebook freehand writing canvas' : undefined}
      aria-hidden={!active}
    />
  );
}
