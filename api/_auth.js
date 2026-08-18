const crypto = require('crypto');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  // SESSION_SECRET should be explicitly configured in production.
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('Falta configurar SESSION_SECRET');
  return String(secret);
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function crearToken(usuario) {
  const payload = {
    sub: Number(usuario.id),
    username: usuario.username,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function verificarToken(token) {
  if (!token || typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 2) return null;

  const [encoded, signature] = partes;
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }

  if (!payload || !payload.sub || !payload.username || !payload.exp || Date.now() > Number(payload.exp)) {
    return null;
  }

  return payload;
}

function extraerBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function obtenerAuth(req) {
  const payload = verificarToken(extraerBearer(req));
  return payload;
}

function requerirAuth(req, res) {
  const auth = obtenerAuth(req);
  if (!auth) {
    res.status(401).json({ success: false, error: 'Sesión no válida o expirada' });
    return null;
  }
  return auth;
}

module.exports = { TOKEN_TTL_MS, crearToken, verificarToken, extraerBearer, obtenerAuth, requerirAuth };
