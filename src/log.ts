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

class FLog {
  onlog: FLog['log'];

  log(sev: string, tag: string, args: any[]) {
    this.onlog && this.onlog(sev, tag, args);
    args = args.map(cleanup);
    console[cname[sev]](sev, '[' + tag + ']', ...args);
    if (sev != 'D')
      logdb.writeLog(sev, tag, args);
  }

  withTag(tag: string) {
    return new TaggedLogger(tag);
  }
}

const flog = new FLog;

export class TaggedLogger {
  constructor(public tag: string) { }

  d(...args) {
    flog.log('D', this.tag, args);
  }

  i(...args) {
    flog.log('I', this.tag, args);
  }

  w(...args) {
    flog.log('W', this.tag, args);
  }

  e(...args) {
    flog.log('E', this.tag, args);
  }
}

export default flog;
