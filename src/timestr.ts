export function recentTimeToStr(time: Date) {
  let diff = (Date.now() - time.getTime()) / 86400 / 1000;
  if (diff < 1) return `today`;
  if (diff < 10) return `days ago`;
  if (diff < 30) return `weeks ago`;
  if (diff < 365) return `months ago`;
  return `years ago`;
}
