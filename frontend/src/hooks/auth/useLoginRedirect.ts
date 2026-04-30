// src/hooks/auth/useLoginRedirect.ts
// Bereitet das Redirect-Ziel nach einem Login fuer Anzeige und Navigation auf.

import { useLocation } from 'react-router-dom';

interface RedirectLocation {
  pathname?: string;
  search?: string;
  hash?: string;
}

interface UseLoginRedirectReturn {
  redirectPath: string | null;
  redirectLabel: string | null;
}

function getRedirectTarget(locationState: unknown): RedirectLocation | null {
  return (locationState as { from?: RedirectLocation } | null)?.from ?? null;
}

function getRedirectLabel(pathname?: string): string | null {
  if (!pathname) {
    return null;
  }

  if (pathname.startsWith('/slides/archive/')) {
    return 'das Foliendeck im Folienarchiv';
  }

  const pageNames: Record<string, string> = {
    '/generate': 'die Fragengenerierung',
    '/slides/generate': 'die Foliengenerierung',
    '/archive': 'das Fragenarchiv',
    '/slides/archive': 'das Folienarchiv',
    '/change-password': 'die Passwortänderung',
  };

  return pageNames[pathname] ?? 'die angeforderte Seite';
}

export function useLoginRedirect(): UseLoginRedirectReturn {
  const location = useLocation();
  const redirectedFrom = getRedirectTarget(location.state);
  const redirectPath = redirectedFrom
    ? `${redirectedFrom.pathname ?? '/'}${redirectedFrom.search ?? ''}${redirectedFrom.hash ?? ''}`
    : null;

  return {
    redirectPath,
    redirectLabel: getRedirectLabel(redirectedFrom?.pathname),
  };
}
