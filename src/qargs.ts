import { TaggedLogger } from "./log";

interface QArgs {
  'page': any;
  'rpc': any;
  'path': any;
  'uid': any;
  'sfc': any;
  'idir': any;
  'tskey': any;
  'vpt': any;
  'pnt': any;
}

type ArgId = keyof QArgs;

let log = new TaggedLogger('qargs');

export function get<K extends ArgId>(arg: K): QArgs[K] {
  let args = parseArgs();
  return args.get(arg);
}

export function set(newArgs) {
  let args = parseArgs();
  for (let arg in newArgs)
    args.set(arg, newArgs[arg]);
  let query = serializeArgs(args);
  log.i('location.hash = #' + query);
  location.hash = '#' + query;
}

export function make(args) {
  let map = new Map(Object.entries(args));
  return serializeArgs(map);
}

function parseArgs(str = location.hash.slice(1)) {
  let res = new Map<string, string>();
  if (!str) return res;

  for (let pair of str.split('&')) {
    let i = pair.indexOf('=');
    let key = decodeURIComponent(pair.slice(0, i));
    let val = decodeURIComponent(pair.slice(i + 1));
    res.set(key, val);
  }

  return res;
}

function serializeArgs(args: Map<string, string>) {
  let pairs: string[] = [];

  for (let [key, val] of args) {
    if (isNull(val)) continue;
    let encKey = encodeURIComponent(key);
    let encVal = encodeURIComponent(val);
    pairs.push(encKey + '=' + encVal);
  }

  return pairs.join('&');
}

function isNull(argval) {
  return argval === null || argval === undefined;
}

