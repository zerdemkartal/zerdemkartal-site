// Üye kaydının API'ye dönen public görünümü — passHash/sub asla dışarı çıkmaz.
export function pubMember(row) {
  return {
    id: row.id, name: row.name, email: row.email,
    provider: row.provider ?? null, picture: row.picture ?? null,
    birth: row.birth ?? null, joinedAt: row.joinedAt
  };
}
