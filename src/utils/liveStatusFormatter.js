export function formatLiveStatus(liveStatus) {
  if (!liveStatus) return null;

  const rawExpiresAt = liveStatus.expiresAt;
  const expiresAt = rawExpiresAt?.toDate?.() ?? (rawExpiresAt ? new Date(rawExpiresAt) : null);
  if (expiresAt && expiresAt < new Date()) return null;

  switch (liveStatus.type) {
    case 'listening':
      return `${liveStatus.songTitle} - ${liveStatus.artistName}`;
    case 'location':
      return `${liveStatus.placeName}`;
    default:
      return null;
  }
}

export function getLiveStatusType(liveStatus) {
  if (!formatLiveStatus(liveStatus)) return null;
  return liveStatus.type;
}
