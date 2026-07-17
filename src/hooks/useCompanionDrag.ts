import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drag-to-reposition hook using native pointer events.
 * Clamps position within the viewport and persists the last
 * position to localStorage. Snaps to the nearest screen edge on release.
 */

interface DragState {
  isDragging: boolean;
  position: { x: number; y: number };
}

const STORAGE_KEY = "medi_companion_position_v1";
const COMPANION_WIDTH = 180;
const COMPANION_HEIGHT = 260;
const EDGE_MARGIN = 12;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function loadPosition(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.x === "number" && typeof p.y === "number") return p;
    }
  } catch {
    /* ignore */
  }
  return {
    x: (typeof window !== "undefined" ? window.innerWidth : 1200) - COMPANION_WIDTH - EDGE_MARGIN,
    y: (typeof window !== "undefined" ? window.innerHeight : 800) - COMPANION_HEIGHT - EDGE_MARGIN - 60,
  };
}

export function useCompanionDrag() {
  const [state, setState] = useState<DragState>({
    isDragging: false,
    position: loadPosition(),
  });

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      isDraggingRef.current = true;
      dragOffsetRef.current = {
        x: e.clientX - state.position.x,
        y: e.clientY - state.position.y,
      };
      setState((s) => ({ ...s, isDragging: true }));
    },
    [state.position]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = clamp(e.clientX - dragOffsetRef.current.x, EDGE_MARGIN, vw - COMPANION_WIDTH - EDGE_MARGIN);
    const y = clamp(e.clientY - dragOffsetRef.current.y, EDGE_MARGIN, vh - COMPANION_HEIGHT - EDGE_MARGIN);
    setState({ isDragging: true, position: { x, y } });
  }, []);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setState((s) => {
      /* snap to nearest horizontal edge */
      const vw = window.innerWidth;
      const centerX = s.position.x + COMPANION_WIDTH / 2;
      const snappedX =
        centerX < vw / 2
          ? EDGE_MARGIN
          : vw - COMPANION_WIDTH - EDGE_MARGIN;
      const final = { x: snappedX, y: s.position.y };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
      return { isDragging: false, position: final };
    });
  }, []);

  /* recalculate on window resize */
  useEffect(() => {
    const handleResize = () => {
      setState((s) => ({
        ...s,
        position: {
          x: clamp(s.position.x, EDGE_MARGIN, window.innerWidth - COMPANION_WIDTH - EDGE_MARGIN),
          y: clamp(s.position.y, EDGE_MARGIN, window.innerHeight - COMPANION_HEIGHT - EDGE_MARGIN),
        },
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    position: state.position,
    isDragging: state.isDragging,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}
