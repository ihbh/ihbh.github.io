import * as logdb from './logdb';

export class TaggedLogger {
  readonly tag: string;

  constructor(tag: string) {
    this.tag = '[' + tag + ']';
  }

  d(...args) {
    console.debug('D', this.tag, ...args);
    this.save('D', args);
  }

  i(...args) {
    console.info('I', this.tag, ...args);
    this.save('I', args);
  }

  w(...args) {
    console.warn('W', this.tag, ...args);
    this.save('W', args);
  }

  e(...args) {
    console.error('E', this.tag, ...args);
    this.save('E', args);
  }

  private save(sev: string, args: any[]) {
    logdb.writeLog(sev, this.tag, args);
  }
}
