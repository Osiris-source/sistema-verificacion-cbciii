export function apiRootUrl(): string {
  const ventana = window as { __API_URL__?: string };
  if (ventana.__API_URL__) {
    return ventana.__API_URL__.replace(/\/+$/, '');
  }
  const hostname = window.location.hostname;
  const esLocal =
    hostname === 'localhost' || hostname === '127.0.0.1';
  if (esLocal) {
    return 'http://localhost:1337';
  }
  const etiquetas = hostname.split('.');
  if (etiquetas.length > 2) {
    return `https://cbc-api.${etiquetas.slice(1).join('.')}`;
  }
  return `https://${hostname}`;
}

export function apiBaseUrl(): string {
  return `${apiRootUrl()}/api`;
}

export function apiMediaUrl(path: string): string {
  if (!path) {
    return '';
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${apiRootUrl()}${path}`;
}