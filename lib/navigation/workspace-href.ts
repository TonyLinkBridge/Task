export type WorkspaceSearchParams = Record<string, string | string[] | undefined>;

/** Map known legacy pages while retaining the record, query and fragment. */
export function workspaceHref(href: string): string {
  const parts = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(href);
  if (!parts) return href;
  const path = parts[1].replace(/\/$/, '') || '/';
  let query = parts[2] ?? '';
  const hash = parts[3] ?? '';
  let destination = path;
  if (path === '/' || path === '/dashboard') destination = '/marketing';
  else if (path === '/tasks') destination = '/marketing/tasks';
  else if (path === '/content') {
    destination = '/marketing/calendar';
    const filters = new URLSearchParams(query);
    if (!filters.has('view')) query = '?view=list' + (query ? '&' + query.slice(1) : '');
  } else if (/^\/content\/[^/]+$/.test(path)) destination = '/marketing' + path;
  else if (path === '/admin/settings') destination = '/marketing/settings/notifications';
  else if (path === '/admin/history') destination = '/marketing/history';
  else return href;
  return destination + query + hash;
}

export function legacyWorkspaceHref(path: string, params: WorkspaceSearchParams = {}): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  }
  return workspaceHref(path + (query.size ? '?' + query.toString() : ''));
}
