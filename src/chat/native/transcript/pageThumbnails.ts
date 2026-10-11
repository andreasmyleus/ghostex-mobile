/**
 * The pictures on published pages' chat cards, by page id, as the core's `pageThumbnail` host
 * action delivers them (`packages/gx-chat-core/src/transcript/page_thumbnails.rs`). The host writes
 * them here (`rust/host.ts`); `VisualBlock`'s page card reads them and asks again (`loadPageThumbnail`)
 * after `retryInMs` while the picture is still on its way. Desktop keeps the same map on its view
 * (`native_chat/page_card.rs`). Page ids are unguessable 128-bit ids, so one map serves every chat.
 */

import { create } from 'zustand';

export type PageThumbnail = {
  /** Base64 PNG, or null while there is none yet. */
  png: string | null;
  /** This is the page's current picture (or there will be none); nothing more to ask. */
  settled: boolean;
  /** How long to wait before asking again, when not settled. */
  retryInMs: number | null;
  /** Bumped on every answer, so a card waiting on the same page wakes for each one. */
  revision: number;
};

type PageThumbnailState = { pages: { [pageId: string]: PageThumbnail } };

export const usePageThumbnailStore = create<PageThumbnailState>(() => ({ pages: {} }));

/** The host's arm for `pageThumbnail` (`{pageId, png, settled, retryInMs}`). */
export function receivePageThumbnail(fields: Record<string, unknown>): void {
  const pageId = typeof fields.pageId === 'string' ? fields.pageId : '';
  if (pageId.length === 0) return;
  usePageThumbnailStore.setState((state) => {
    const previous = state.pages[pageId];
    const png = typeof fields.png === 'string' && fields.png.length > 0 ? fields.png : null;
    return {
      pages: {
        ...state.pages,
        [pageId]: {
          // A stale picture stays up until its replacement arrives.
          png: png ?? previous?.png ?? null,
          settled: fields.settled !== false,
          retryInMs: typeof fields.retryInMs === 'number' ? fields.retryInMs : null,
          revision: (previous?.revision ?? 0) + 1,
        },
      },
    };
  });
}

/** The answered state each page's picture was last asked for (cards remount as the list scrolls). */
const asked = new Map<string, boolean>();

/** Whether a card should ask for `pageId`'s picture now: never asked, or asked before it was answered. */
export function askedPageThumbnail(pageId: string, answered: boolean): boolean {
  if (asked.get(pageId) === answered) return false;
  asked.set(pageId, answered);
  return true;
}
