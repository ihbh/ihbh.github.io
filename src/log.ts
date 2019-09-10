import * as logdb from './logdb';

export class TaggedLogger {
  readonly tag: string;

  constructor(tag: string) {
    this.tag = '[' + tag + ']';
  }

  d(...args) {
    console.debug(this.tag, ...args);
    this.save('D', args);
  }

  i(...args) {
    console.info(this.tag, ...args);
    this.save('I', args);
  }

  w(...args) {
    console.warn(this.tag, ...args);
    this.save('W', args);
  }

  e(...args) {
    console.error(this.tag, ...args);
    this.save('E', args);
  }

  private save(sev: string, args: any[]) {
    logdb.writeLog(sev, this.tag, args);
  }
}
