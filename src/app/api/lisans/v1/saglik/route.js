import { LICENSE_PROTOCOL } from '@/lib/license/contract.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    tamam: true,
    servis: 'hermes-license-v1',
    protokol: LICENSE_PROTOCOL,
    etkin: process.env.LICENSE_V1_ENABLED === '1',
    yaptirim: process.env.LICENSE_V1_ENFORCEMENT === '1' ? 'hazirlik' : 'kapali'
  }, { headers: { 'Cache-Control': 'no-store' } });
}
