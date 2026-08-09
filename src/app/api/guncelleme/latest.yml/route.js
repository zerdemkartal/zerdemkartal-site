import { GET as windowsUpdate } from '../windows/route';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return windowsUpdate(request);
}
