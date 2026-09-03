import { useState, useCallback } from 'react';

// Delays the real close callback so the `.is-closing` CSS animation
// (see App.css) has time to play before the modal unmounts — otherwise
// React removes the node the instant the backdrop/X is clicked and no
// exit animation is visible. Resets `closing` back to false right after
// onClose fires (harmless no-op if the caller has already unmounted) so
// a caller that owns this hook itself — rather than being unmounted by
// it, e.g. a modal toggled from a parent's own boolean state — doesn't
// reopen already mid-exit-animation next time.
export function useClosingTransition(onClose, duration = 160) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => { onClose(); setClosing(false); }, duration);
  }, [onClose, duration]);
  return { closing, close };
}
