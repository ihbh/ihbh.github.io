export function recentTimeToStr(time: Date) {
  let diff = (Date.now() - time.getTime()) / 86400 / 1000 | 0;
  if (diff < 1) return `today`;
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${diff / 30 | 0} months ago`;
  return `${diff / 365 | 0} years ago`;
}
