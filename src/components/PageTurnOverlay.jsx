import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import {
  formatNoteTimestamp,
  getFontMeta,
  getPaperBackgroundStyle,
  LINE_HEIGHT,
  MIN_PAGE_HEIGHT,
} from '../utils/notebookPresets';
import { getSubjectStyle } from '../utils/taskStyles';

function buildStrokeSvgPath(points, width) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    const x = points[0].x * width;
    const y = points[0].y;
    return `M ${x} ${y} L ${x + 0.1} ${y + 0.1}`;
  }

  let d = `M ${points[0].x * width} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const xCurr = points[i].x * width;
    const yCurr = points[i].y;
    const xNext = points[i + 1].x * width;
    const yNext = points[i + 1].y;
    const midX = (xCurr + xNext) / 2;
    const midY = (yCurr + yNext) / 2;
    d += ` Q ${xCurr} ${yCurr} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x * width} ${last.y}`;
  return d;
}

function StaticSheetSurface({ page, bodyWidth, bodyHeight }) {
  const paperStyle = page.paperStyle || 'ruled';
  const fontMeta = getFontMeta(page.fontStyle);
  const subjectStyle = getSubjectStyle(page.subject || 'Discussion');
  const strokes = page.strokes || [];

  return (
    <>
      {page.bookmarked && (
        <div
          className="absolute top-0 right-6 sm:right-10 w-6 h-9 bg-[#FF92A4] shadow-sm z-20"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)',
          }}
        />
      )}

      <div className="relative px-4 sm:px-7 pt-5 pb-3 border-b-2 border-[#4E51BF]/25">
        {paperStyle === 'ruled' && (
          <div className="pointer-events-none absolute top-0 bottom-0 left-7 sm:left-10 border-l-2 border-[#FF92A4]/50" />
        )}

        <div className="pl-6 sm:pl-7">
          <div className="flex items-center justify-between gap-2 pr-8">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${subjectStyle.chipClass}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${subjectStyle.dotClass}`}
                />
                <span>{page.subject || 'General'}</span>
              </span>
              <span className="text-[11px] text-[#8A8F9E]">
                {formatNoteTimestamp(page.updatedAt)}
              </span>
            </div>
            {page.bookmarked && (
              <Bookmark className="w-3.5 h-3.5 text-[#FF92A4] fill-[#FF92A4]" />
            )}
          </div>

          <div
            className={`mt-2 w-full text-[#24252A] truncate ${fontMeta.titleClass}`}
          >
            {page.title || 'Untitled Discussion Note'}
          </div>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        style={getPaperBackgroundStyle(paperStyle)}
      >
        {paperStyle === 'ruled' && (
          <div className="pointer-events-none absolute top-0 bottom-0 left-7 sm:left-10 border-l-2 border-[#FF92A4]/50 z-10" />
        )}

        <div
          style={{
            lineHeight: `${LINE_HEIGHT}px`,
            color: page.textInkColor || '#24252A',
            minHeight: `${MIN_PAGE_HEIGHT}px`,
          }}
          className={`relative z-10 whitespace-pre-wrap break-words pl-10 sm:pl-14 pr-5 sm:pr-8 py-0 ${fontMeta.bodyClass}`}
        >
          {page.content || ''}
        </div>

        {strokes.length > 0 && (
          <svg
            viewBox={`0 0 ${Math.max(1, bodyWidth)} ${Math.max(1, bodyHeight)}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full z-20 pointer-events-none"
          >
            {strokes.map((stroke) => {
              const isHighlighter = stroke.tool === 'highlighter';
              return (
                <path
                  key={stroke.id}
                  d={buildStrokeSvgPath(stroke.points, bodyWidth)}
                  fill="none"
                  stroke={stroke.color || '#24252A'}
                  strokeWidth={
                    isHighlighter
                      ? (stroke.size || 3) * 5.2
                      : stroke.size || 2.5
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={isHighlighter ? 0.34 : 0.94}
                />
              );
            })}
          </svg>
        )}
      </div>
    </>
  );
}

export function PageTurnOverlay({ turn, onComplete }) {
  if (!turn?.page) return null;

  const {
    page,
    backingPage = null,
    direction,
    bodyWidth = 680,
    bodyHeight = MIN_PAGE_HEIGHT,
    id,
  } = turn;
  const isForward = direction >= 0;

  return (
    <>
      {/* When turning backward, temporarily keep the previous page visible beneath the falling sheet */}
      {!isForward && backingPage && (
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 z-20 bg-gradient-to-b from-[#FFFEFB] to-[#FFFAF2] overflow-hidden flex flex-col"
        >
          <StaticSheetSurface
            page={backingPage}
            bodyWidth={bodyWidth}
            bodyHeight={bodyHeight}
          />
        </div>
      )}

      {/* Soft cast shadow on underlying sheet while page turns */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: isForward ? 0.32 : 0.36 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background:
            'linear-gradient(90deg, rgba(36, 37, 42, 0.24) 0%, rgba(36, 37, 42, 0.08) 45%, transparent 85%)',
        }}
      />

      {/* Hinged 3D Turning Paper Flap */}
      <motion.div
        aria-hidden="true"
        initial={
          isForward
            ? { rotateY: 0, rotateZ: 0, scaleX: 1, opacity: 1 }
            : { rotateY: -88, rotateZ: -0.9, scaleX: 0.92, opacity: 0.35 }
        }
        animate={
          isForward
            ? {
                rotateY: [0, -28, -90],
                rotateZ: [0, -0.5, -1.1],
                scaleX: [1, 0.96, 0.9],
                opacity: [1, 0.96, 0],
              }
            : {
                rotateY: [-88, -20, 0],
                rotateZ: [-0.9, -0.3, 0],
                scaleX: [0.92, 0.97, 1],
                opacity: [0.35, 0.98, 1],
              }
        }
        transition={{
          duration: 0.48,
          times: [0, 0.42, 1],
          ease: [0.22, 0.85, 0.32, 1],
        }}
        onAnimationComplete={() => onComplete?.(id)}
        style={{
          transformOrigin: '0% 50%',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
        className="pointer-events-none select-none absolute inset-0 z-40 bg-gradient-to-b from-[#FFFEFB] to-[#FFFAF2] border-l border-[#DFD5C2]/70 shadow-[-12px_10px_28px_-14px_rgba(36,37,42,0.34)] overflow-hidden flex flex-col"
      >
        {/* Dynamic Light Curl Sweep Across Turning Paper */}
        <motion.div
          initial={{ opacity: isForward ? 0 : 0.75 }}
          animate={
            isForward
              ? { opacity: [0, 0.85, 0.45] }
              : { opacity: [0.75, 0.5, 0] }
          }
          transition={{ duration: 0.48, times: [0, 0.45, 1] }}
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background:
              'linear-gradient(90deg, rgba(36,37,42,0.14) 0%, rgba(255,255,255,0.52) 18%, rgba(230,222,200,0.22) 55%, rgba(36,37,42,0.06) 100%)',
          }}
        />

        <StaticSheetSurface
          page={page}
          bodyWidth={bodyWidth}
          bodyHeight={bodyHeight}
        />
      </motion.div>
    </>
  );
}
