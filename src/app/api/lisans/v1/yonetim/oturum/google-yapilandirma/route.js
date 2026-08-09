import { licenseGoogleClientId } from '@/lib/license/google-auth.mjs';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  if (process.env.LICENSE_V1_ENABLED !== '1') return json({ error: 'lisans-servisi-hazirlikta' }, 503);
  try {
    return json({ tamam: true, clientId: licenseGoogleClientId() });
  } catch {
    return json({ error: 'google-girisi-hazir-degil' }, 503);
  }
}
