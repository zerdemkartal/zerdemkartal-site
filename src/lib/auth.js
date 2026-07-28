import jwt from 'jsonwebtoken';

/** Bearer token doğrulama: panel JWT'si YA DA uzun ömürlü ADMIN_TOKEN (MCP).
 *  Kullanım (route handler):
 *    const err = requireAdmin(request); if (err) return err; */
export function requireAdmin(request) {
  const token = bearerToken(request);
  if (!token) return unauthorized();
  if (process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN) return null; // MCP yolu
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin' || !payload.sub) return unauthorized();
    return null;
  } catch {
    return unauthorized();
  }
}

export function signAdminJwt(email) {
  return jwt.sign({ sub: email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });
}

/** Posta Merkezi erişimi: ana yönetici veya yalnız posta yetkili kullanıcı.
 *  mail_operator token'ı diğer yönetim API'lerinde requireAdmin tarafından reddedilir. */
export function requireMailAccess(request) {
  const token = bearerToken(request);
  if (!token) return unauthorized();
  if (process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!['admin', 'mail_operator'].includes(payload.role) || !payload.sub) return unauthorized();
    return null;
  } catch {
    return unauthorized();
  }
}

export function signMailOperatorJwt(email) {
  return jwt.sign({ sub: email, role: 'mail_operator' }, process.env.JWT_SECRET, { expiresIn: '12h' });
}

// ---- Üye oturumu (site üyeliği; admin'den ayrı rol) ----
export function signMemberJwt(email) {
  return jwt.sign({ sub: email, role: 'member' }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

/** Üye token'ından e-posta çıkarır. Dönüş: e-posta string'i YA DA 401 Response.
 *  Kullanım: const who = requireMemberEmail(request); if (who instanceof Response) return who; */
export function requireMemberEmail(request) {
  const h = request.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return unauthorized();
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    if (p.role !== 'member' || !p.sub) return unauthorized();
    return p.sub;
  } catch {
    return unauthorized();
  }
}

function unauthorized() {
  return Response.json({ error: 'unauthorized' }, { status: 401 });
}

function bearerToken(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}
