// IndexNow anahtar dosyası — keyLocation: <SITE>/indexnow.txt
export const dynamic = 'force-dynamic';

export function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response('', { status: 404 });
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
