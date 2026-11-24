import { create } from 'zustand';

import { isApiError } from '@/lib/api/errors';
import { queryClient } from '@/lib/query-client';

export const UNDO_SECONDS = 10;

type PendingSave = {
  id: number;
  /** Spoken and shown on the success screen. */
  summary: string;
  run: () => Promise<unknown>;
  timer: ReturnType<typeof setTimeout>;
  deadline: number;
};

type State = {
  pending: PendingSave | null;
  /** Set when a held save failed after the undo window, so Home can say so. */
  failed: { summary: string; offline: boolean } | null;
  /** Hold a write for UNDO_SECONDS, then send it. Undo cancels it locally (no DELETE permission needed). */
  schedule: (summary: string, run: () => Promise<unknown>) => void;
  undo: () => void;
  /** Send now (e.g. a second save starts before the first window ends). */
  flush: () => Promise<void>;
  clearFailure: () => void;
};

let nextId = 1;

async function send(save: PendingSave, set: (s: Partial<State>) => void) {
  try {
    await save.run();
    await queryClient.invalidateQueries();
  } catch (error) {
    set({ failed: { summary: save.summary, offline: isApiError(error) && error.isOffline } });
  }
}

// Stage 1 keeps the held write in memory: closing the app within 10 s loses it.
// The Stage 2 offline outbox replaces this timer with a persisted queue.
export const usePendingSave = create<State>()((set, get) => ({
  pending: null,
  failed: null,

  schedule: (summary, run) => {
    void get().flush();
    const id = nextId++;
    const timer = setTimeout(() => {
      const current = get().pending;
      if (current?.id !== id) return;
      set({ pending: null });
      void send(current, set);
    }, UNDO_SECONDS * 1000);
    set({ pending: { id, summary, run, timer, deadline: Date.now() + UNDO_SECONDS * 1000 }, failed: null });
  },

  undo: () => {
    const current = get().pending;
    if (current) clearTimeout(current.timer);
    set({ pending: null });
  },

  flush: async () => {
    const current = get().pending;
    if (!current) return;
    clearTimeout(current.timer);
    set({ pending: null });
    await send(current, set);
  },

  clearFailure: () => set({ failed: null }),
}));
