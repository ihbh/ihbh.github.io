export const sleep = (dt: number) => new Promise<void>(
  resolve => setTimeout(() => resolve(null), dt));