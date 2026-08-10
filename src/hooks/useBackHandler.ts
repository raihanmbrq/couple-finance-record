import { useEffect, useRef } from 'react';

// ponytail: single global listener + stack. Upgrade to router-aware if adding SPA routing.
const handlerStack: Array<() => void> = [];
let skipCount = 0;
let listenerAttached = false;

function globalPopStateHandler() {
  if (skipCount > 0) {
    skipCount--;
    return;
  }
  const handler = handlerStack.pop();
  if (handler) handler();
}

function attachGlobalListener() {
  if (!listenerAttached) {
    window.addEventListener('popstate', globalPopStateHandler);
    listenerAttached = true;
  }
}

export function useBackHandler(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const registered = useRef(false);
  const callbackRef = useRef<() => void>();

  useEffect(() => {
    if (!isOpen) {
      if (registered.current && callbackRef.current) {
        const idx = handlerStack.indexOf(callbackRef.current);
        if (idx !== -1) handlerStack.splice(idx, 1);
        skipCount++;
        window.history.back();
        registered.current = false;
      }
      return;
    }

    attachGlobalListener();
    const cb = () => {
      registered.current = false; // back button already popped history, skip effect cleanup
      onCloseRef.current();
    };
    callbackRef.current = cb;
    window.history.pushState(null, '');
    handlerStack.push(cb);
    registered.current = true;
  }, [isOpen]);
}