import { useEffect, useRef, useState } from 'react';
import { ImageOff, Trash2 } from 'lucide-react';
import { useNotebookImageUrl } from '../utils/notebookImageStore';

const MIN_IMAGE_PX = 56;
const CORNERS = ['nw', 'ne', 'sw', 'se'];

const CORNER_POSITION = {
  nw: '-left-3.5 -top-3.5 cursor-nwse-resize',
  ne: '-right-3.5 -top-3.5 cursor-nesw-resize',
  sw: '-left-3.5 -bottom-3.5 cursor-nesw-resize',
  se: '-right-3.5 -bottom-3.5 cursor-nwse-resize',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function getImageHeightPx(image, bodyWidth) {
  return (image.w || 0) * bodyWidth * (image.aspect || 1);
}

export function getImagesBottomPx(images, bodyWidth) {
  if (!images?.length || !bodyWidth) return 0;
  return images.reduce(
    (maxBottom, image) =>
      Math.max(maxBottom, (image.y || 0) + getImageHeightPx(image, bodyWidth)),
    0
  );
}

function NotebookImageItem({
  image,
  layerWidth,
  interactive,
  selected,
  onSelect,
  onCommit,
  onDelete,
}) {
  const { url, missing } = useNotebookImageUrl(image.blobId);
  const [live, setLive] = useState(null);
  const liveRef = useRef(null);
  const gestureRef = useRef(null);
  const cleanupRef = useRef(null);
  const itemRef = useRef(null);
  const layerWidthRef = useRef(layerWidth);
  layerWidthRef.current = layerWidth;

  useEffect(() => () => cleanupRef.current?.(), []);

  const aspect = image.aspect || 1;
  const geom = live || image;
  const widthPx = geom.w * layerWidth;
  const heightPx = widthPx * aspect;
  const leftPx = geom.x * layerWidth;

  const updateLive = (next) => {
    liveRef.current = next;
    setLive(next);
  };

  const beginGesture = (event, mode, corner = null) => {
    event.preventDefault();
    event.stopPropagation();
    cleanupRef.current?.();

    const W = layerWidthRef.current || 1;
    gestureRef.current = {
      mode,
      corner,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: { x: image.x * W, y: image.y, w: image.w * W },
      moved: false,
    };

    const handleMove = (ev) => {
      const g = gestureRef.current;
      if (!g || ev.pointerId !== g.pointerId) return;
      const dx = ev.clientX - g.startX;
      const dy = ev.clientY - g.startY;
      if (!g.moved && Math.hypot(dx, dy) < 3) return;
      g.moved = true;

      const width = layerWidthRef.current || 1;
      let { x, y, w } = g.start;

      if (g.mode === 'move') {
        x = clamp(x + dx, 0, Math.max(0, width - w));
        y = Math.max(0, y + dy);
      } else {
        const east = g.corner.includes('e');
        const south = g.corner.includes('s');
        const fromX = (east ? 1 : -1) * dx;
        const fromY = ((south ? 1 : -1) * dy) / aspect;
        const delta = Math.abs(fromX) >= Math.abs(fromY) ? fromX : fromY;

        const startRight = g.start.x + g.start.w;
        const startBottom = g.start.y + g.start.w * aspect;
        const maxWFromX = east ? width - g.start.x : startRight;
        const maxWFromY = south ? width : startBottom / aspect;
        const minW = Math.min(MIN_IMAGE_PX, width);
        const maxW = Math.max(minW, Math.min(width, maxWFromX, maxWFromY));

        const nextW = clamp(w + delta, minW, maxW);
        if (!east) x = Math.max(0, startRight - nextW);
        if (!south) y = Math.max(0, startBottom - nextW * aspect);
        w = nextW;
      }

      updateLive({ x: x / width, y, w: w / width });
    };

    const finish = (ev) => {
      const g = gestureRef.current;
      if (!g || (ev && ev.pointerId !== g.pointerId)) return;
      cleanupRef.current?.();
      const result = liveRef.current;
      if (g.moved && result) {
        onCommit(image.id, result);
      }
      gestureRef.current = null;
      updateLive(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      cleanupRef.current = null;
    };
  };

  const handleBodyPointerDown = (event) => {
    if (!interactive) return;
    if (event.button !== undefined && event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    itemRef.current?.focus({ preventScroll: true });
    if (!selected) {
      onSelect(image.id);
      // On touch, the first tap only selects so the page can still scroll past photos
      if (event.pointerType !== 'mouse') return;
    }
    beginGesture(event, 'move');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onDelete(image.id);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onSelect(null);
      itemRef.current?.blur();
    }
  };

  return (
    <div
      ref={itemRef}
      data-notebook-image-ui="true"
      tabIndex={interactive ? 0 : -1}
      role="img"
      aria-label={selected ? 'Selected photo — drag to move, use corners to resize, Delete to remove' : 'Notebook photo'}
      onPointerDown={handleBodyPointerDown}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        if (interactive && !selected) onSelect(image.id);
      }}
      style={{
        left: `${leftPx}px`,
        top: `${geom.y}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        touchAction: selected ? 'none' : 'pan-y',
      }}
      className={`absolute select-none outline-none ${
        interactive ? 'pointer-events-auto' : 'pointer-events-none'
      } ${selected ? 'cursor-move z-10' : interactive ? 'cursor-pointer' : ''}`}
    >
      <div
        className={`w-full h-full rounded-md overflow-hidden bg-white shadow-[0_6px_18px_-8px_rgba(36,37,42,0.35)] ring-1 transition-shadow ${
          selected ? 'ring-2 ring-[#4E51BF]' : 'ring-black/[0.06]'
        }`}
      >
        {url ? (
          <img
            src={url}
            alt=""
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-[#F6F1E6] text-[#8A8F9E] text-[11px]">
            {missing ? (
              <>
                <ImageOff className="w-5 h-5" />
                <span>Photo unavailable</span>
              </>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-[#4E51BF]/30 border-t-[#4E51BF] animate-spin" />
            )}
          </div>
        )}
      </div>

      {selected && interactive && (
        <>
          <button
            type="button"
            data-notebook-image-ui="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id);
            }}
            aria-label="Delete photo"
            title="Delete photo"
            className="absolute -top-10 right-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#FF92A4]/50 text-[11px] font-semibold text-[#9F1239] shadow-md hover:bg-[#FFF1F3] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          {CORNERS.map((corner) => (
            <span
              key={corner}
              data-notebook-image-ui="true"
              onPointerDown={(e) => beginGesture(e, 'resize', corner)}
              aria-hidden="true"
              style={{ touchAction: 'none' }}
              className={`absolute w-7 h-7 flex items-center justify-center ${CORNER_POSITION[corner]}`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#4E51BF] shadow-sm" />
            </span>
          ))}
        </>
      )}
    </div>
  );
}

export function NotebookImageLayer({
  images = [],
  interactive = true,
  selectedId = null,
  width = null,
  onSelect,
  onCommit,
  onDelete,
}) {
  const layerRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (width) return undefined;
    const el = layerRef.current;
    if (!el) return undefined;
    const sync = () =>
      setMeasuredWidth(el.clientWidth || el.getBoundingClientRect().width);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  const layerWidth = width || measuredWidth;

  // Clicking anywhere outside a photo clears the selection
  useEffect(() => {
    if (!selectedId || !interactive) return undefined;
    const handlePointerDown = (event) => {
      if (event.target?.closest?.('[data-notebook-image-ui="true"]')) return;
      onSelect?.(null);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [selectedId, interactive, onSelect]);

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 z-[15] pointer-events-none"
    >
      {layerWidth > 0 &&
        images.map((image) => (
          <NotebookImageItem
            key={image.id}
            image={image}
            layerWidth={layerWidth}
            interactive={interactive}
            selected={selectedId === image.id}
            onSelect={onSelect}
            onCommit={onCommit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}
