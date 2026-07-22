// robots.txt — dinamik (kök robots.txt prototip dosyasının deploy karşılığı).
// AI botları bilinçli olarak açık (llms.txt ile birlikte); admin + API kapalı.
const SITE = (process.env.SITE_URL || 'https://hermesastroloji.com').replace(/\/$/, '');

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/yonetim', '/admin', '/api/', '/uye'] },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' }
    ],
    sitemap: SITE + '/sitemap.xml'
  };
}
