import * as logdb from './logdb';
import * as conf from './config';

const cname = {
  D: 'debug',
  I: 'info',
  W: 'warn',
  E: 'error',
};

function cleanup(x) {
  if (typeof x == 'string' && x.length > conf.LOG_MAXLEN)
    return x.slice(0, conf.LOG_MAXLEN) + '...(' + x.length + ' chars)';
  return x;
}

function log(sev: string, tag: string, args: any[]) {
  args = args.map(cleanup);
  console[cname[sev]](sev, '[' + tag + ']', ...args);
  if (sev != 'D')
    logdb.writeLog(sev, tag, args);
}

export class TaggedLogger {
  constructor(public tag: string) { }

  d(...args) {
    log('D', this.tag, args);
  }

  i(...args) {
    log('I', this.tag, args);
  }

  w(...args) {
    log('W', this.tag, args);
  }

  e(...args) {
    log('E', this.tag, args);
  }
}
