export function recentTimeToStr(time: Date) {
  let minutes = (Date.now() - time.getTime()) / 1000 / 60;
  let hours = minutes / 60;
  let days = hours / 24 | 0;
  if (hours < 2) return `${minutes | 0} minutes ago`;
  if (days < 2) return `${hours | 0} hours ago`;
  if (days < 60) return `${days} days ago`;
  if (days < 365 * 2) return `${days / 30 | 0} months ago`;
  return `${days / 365 | 0} years ago`;
}
