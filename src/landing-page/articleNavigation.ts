export interface ArticleEntryState {
  returnTo: string;
  returnScrollY: number;
  returnLabel: string;
}

export function getArticleEntryState(
  state: unknown,
  fallbackPath: string,
): ArticleEntryState {
  if (typeof state === 'object' && state !== null) {
    const stateRecord = state as Record<string, unknown>;
    if (
      typeof stateRecord.returnTo === 'string' &&
      stateRecord.returnTo.startsWith('/') &&
      typeof stateRecord.returnScrollY === 'number' &&
      Number.isFinite(stateRecord.returnScrollY)
    ) {
      return {
        returnTo: stateRecord.returnTo,
        returnScrollY: stateRecord.returnScrollY,
        returnLabel:
          typeof stateRecord.returnLabel === 'string'
            ? stateRecord.returnLabel
            : fallbackPath === '/onboarding'
              ? 'walkthrough'
              : 'landing page',
      };
    }
  }

  return {
    returnTo: fallbackPath,
    returnScrollY: 0,
    returnLabel: fallbackPath === '/onboarding' ? 'walkthrough' : 'landing page',
  };
}

export function getRestoreScrollY(state: unknown): number | undefined {
  if (typeof state !== 'object' || state === null) return undefined;

  const restoreScrollY = (state as Record<string, unknown>).restoreScrollY;
  return typeof restoreScrollY === 'number' && Number.isFinite(restoreScrollY)
    ? restoreScrollY
    : undefined;
}
