export const GITHUB_RELEASE_OWNER = 'zerdemkartal';
export const GITHUB_RELEASE_REPO = 'hermes-yayin';
export const GITHUB_LATEST_METADATA_URL =
  `https://github.com/${GITHUB_RELEASE_OWNER}/${GITHUB_RELEASE_REPO}/releases/latest/download/latest.yml`;
export const GITHUB_RELEASE_REVALIDATE_SECONDS = 300;

function yamlValue(source, key) {
  const match = String(source || '').match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  if (!match) return '';
  const value = match[1].trim();
  if ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseGithubLatestYaml(source) {
  const version = yamlValue(source, 'version');
  const fileName = yamlValue(source, 'path');
  const sha512 = yamlValue(source, 'sha512');
  const sizeText = String(source || '').match(/^\s+size:\s*(\d+)\s*$/m)?.[1] || '';
  const publishedAt = yamlValue(source, 'releaseDate');

  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('github-release-version-invalid');
  }
  if (fileName !== `Hermes-Setup-${version}.exe`) {
    throw new Error('github-release-file-invalid');
  }
  if (!/^[A-Za-z0-9+/]{80,}={0,2}$/.test(sha512)) {
    throw new Error('github-release-sha512-invalid');
  }
  const size = Number(sizeText);
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('github-release-size-invalid');
  }
  const releaseDate = new Date(publishedAt);
  if (!publishedAt || Number.isNaN(releaseDate.getTime())) {
    throw new Error('github-release-date-invalid');
  }

  return {
    id: `github-v${version}`,
    version,
    fileName,
    blobPath: null,
    sha512,
    size,
    publishedAt: releaseDate.toISOString(),
    source: 'github-latest'
  };
}

export async function fetchGithubLatestRelease(fetchImpl = fetch) {
  const response = await fetchImpl(GITHUB_LATEST_METADATA_URL, {
    redirect: 'follow',
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'Hermes-Site-Release-Resolver'
    },
    next: { revalidate: GITHUB_RELEASE_REVALIDATE_SECONDS }
  });
  if (!response.ok) throw new Error(`github-release-http-${response.status}`);
  return parseGithubLatestYaml(await response.text());
}
