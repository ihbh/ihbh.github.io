export class TaggedLogger{
  constructor(private tag: string) {

  }

  i(...args) {
    console.log('[' +this. tag + '] I', ...args);
  }

  e(...args) {
    console.error('[' +this. tag + '] E', ...args);
  }
}
