export function normalizeRedirectPath(redirectRaw) {
  if (!redirectRaw) {
    return '/dashboard';
  }

  if (/^(https?:)?\/\//i.test(redirectRaw)) {
    return '/dashboard';
  }

  const [pathPart, searchPart] = String(redirectRaw).split('?');
  let path = pathPart.trim();

  path = path.replace(/^\.+\//, '/');
  path = path.replace(/^\/+/, '/');

  if (path === '') {
    path = '/dashboard';
  }

  path = path
    .replace(/index\.html$/i, '')
    .replace(/login\.html$/i, '/login')
    .replace(/cadastro\.html$/i, '/cadastro')
    .replace(/dashboard\.html$/i, '/dashboard')
    .replace(/\.html$/i, '');

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return searchPart ? `${path}?${searchPart}` : path;
}
