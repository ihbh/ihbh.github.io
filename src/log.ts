export const logs = [];

export class TaggedLogger{
  constructor(private tag: string) {

  }

  i(...args) {
    console.log('[' +this. tag + '] I', ...args);
    logs.push(['I', ...args]);
  }

  e(...args) {
    console.error('[' +this. tag + '] E', ...args);
    logs.push(['E', ...args]);
  }
}
