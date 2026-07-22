// GitHub releases beslemesi (H3) — /indir sayfası güncel sürümü + notları buradan çeker.
// Repo: zerdemkartal/hermes-yayin (electron-updater ile aynı; RELEASES_REPO env ile değişir).
// Public repo → auth gerekmez. Repo yok/private/ağ hatası → null döner; /indir statik surum bilgisine düşer.
const REPO = process.env.RELEASES_REPO || 'zerdemkartal/hermes-yayin';

export async function getLatestRelease() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'hermes-site' },
      next: { revalidate: 1800 } // 30 dk ISR — her istekte GitHub'a gitmez
    });
    if (!res.ok) return null;
    const d = await res.json();
    const asset = (d.assets || []).find((a) => /\.(exe|msi)$/i.test(a.name)) || (d.assets || [])[0] || null;
    return {
      version: String(d.tag_name || d.name || '').replace(/^v/i, ''),
      notes: d.body || '',
      htmlUrl: d.html_url || null,
      assetUrl: asset?.browser_download_url || null,
      assetName: asset?.name || null,
      publishedAt: d.published_at || null
    };
  } catch {
    return null;
  }
}
