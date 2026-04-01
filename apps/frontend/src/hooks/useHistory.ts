import { useCallback, useRef } from 'react';
import type { DrawElement } from '../types';

export function useHistory(
  setElements: (elements: DrawElement[]) => void
) {
  const undoStack = useRef<DrawElement[][]>([]);
  const redoStack = useRef<DrawElement[][]>([]);

  const pushState = useCallback((elements: DrawElement[]) => {
    undoStack.current.push(JSON.parse(JSON.stringify(elements)));
    redoStack.current = [];
  }, []);

  const undo = useCallback(
    (currentElements: DrawElement[]) => {
      if (undoStack.current.length === 0) return currentElements;

      const prev = undoStack.current.pop()!;
      redoStack.current.push(JSON.parse(JSON.stringify(currentElements)));
      setElements(prev);
      return prev;
    },
    [setElements]
  );

  const redo = useCallback(
    (currentElements: DrawElement[]) => {
      if (redoStack.current.length === 0) return currentElements;

      const next = redoStack.current.pop()!;
      undoStack.current.push(JSON.parse(JSON.stringify(currentElements)));
      setElements(next);
      return next;
    },
    [setElements]
  );

  const canUndo = useCallback(() => undoStack.current.length > 0, []);
  const canRedo = useCallback(() => redoStack.current.length > 0, []);

  return { pushState, undo, redo, canUndo, canRedo };
}
