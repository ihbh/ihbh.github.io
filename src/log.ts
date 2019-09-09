export const logs = [];
const time = Date.now();

savelog('I', 'log', [
  'Logging session started:',
  new Date().toJSON(),
]);

function savelog(sev, tag, args) {
  let ts = ((Date.now() - time) / 1000).toFixed(3);
  logs.push([sev, ts, tag, ...args]);
}

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
    savelog(sev, this.tag, args);
  }
}
