/** Studio pane sizes: a map of panel id to its share of the row, in percent. */
export type PaneLayout = Record<string, number>;

/** Per-viewer UI setting, so it lives in localStorage rather than the IndexedDB stores. */
export function paneLayoutKey(groupId: string): string {
  return `designhub:panes:${groupId}`;
}

/** A saved layout is usable only if it sizes exactly these panels with sensible percentages. */
export function parsePaneLayout(raw: string | null, panelIds: string[]): PaneLayout | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.length !== panelIds.length) return null;
  const layout: PaneLayout = {};
  for (const id of panelIds) {
    const size: unknown = (value as Record<string, unknown>)[id];
    if (typeof size !== "number" || !Number.isFinite(size) || size <= 0 || size >= 100) return null;
    layout[id] = size;
  }
  const total = Object.values(layout).reduce((sum, size) => sum + size, 0);
  return Math.abs(total - 100) < 1 ? layout : null;
}

/** Reads storage defensively: private windows and blocked site data throw on access. */
export function readPaneLayout(groupId: string, panelIds: string[]): PaneLayout | null {
  try {
    return parsePaneLayout(window.localStorage.getItem(paneLayoutKey(groupId)), panelIds);
  } catch {
    return null;
  }
}

export function writePaneLayout(groupId: string, layout: PaneLayout): void {
  try {
    window.localStorage.setItem(paneLayoutKey(groupId), JSON.stringify(layout));
  } catch {
    // Storage is blocked or full; the panes still resize, they just won't be remembered.
  }
}

export function paneRestoreStyleId(groupId: string): string {
  return `designhub-panes-${groupId}`;
}

/**
 * An inline script that runs while the HTML is parsed, before first paint, and sizes the
 * server-rendered panes from storage with a temporary stylesheet. React then applies the same
 * layout after hydration and removes the stylesheet, so there is no visible jump and no
 * hydration mismatch (the stylesheet goes in `<head>`, which React tolerates extra nodes in).
 * The checks mirror `parsePaneLayout`; `minWidth` matches the breakpoint where panes resize.
 */
export function paneRestoreScript(groupId: string, panelIds: string[], minWidth: string): string {
  const args = [paneLayoutKey(groupId), paneRestoreStyleId(groupId), groupId, panelIds, minWidth]
    .map((value) => JSON.stringify(value).replace(/</g, "\\u003c"))
    .join(",");
  return `(function(k,s,g,p,w){try{var l=JSON.parse(localStorage.getItem(k)||"null");if(!l||typeof l!=="object"||Object.keys(l).length!==p.length)return;var t=0,c="";for(var i=0;i<p.length;i++){var v=l[p[i]];if(typeof v!=="number"||!isFinite(v)||v<=0||v>=100)return;t+=v;c+='[id="'+g+'"]>[id="'+p[i]+'"]{flex:'+v+' 1 0px!important}'}if(Math.abs(t-100)>=1||document.getElementById(s))return;var e=document.createElement("style");e.id=s;e.textContent="@media (min-width:"+w+"){"+c+"}";document.head.appendChild(e)}catch(x){}})(${args})`;
}
