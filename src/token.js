// Decode JWT payload without any extra package
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token || token === 'undefined' || token === 'null' || !token.trim()) return false;
  const decoded = decodeToken(token);
  if (!decoded?.exp) return false;
  // exp is in seconds, Date.now() is in ms
  return decoded.exp * 1000 > Date.now();
}