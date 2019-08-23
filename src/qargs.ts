import { TaggedLogger } from "./log";

type ArgId = 'page' | 'lat' | 'lon' | 'vpt' | 'pnt';

let log = new TaggedLogger('qargs');
let args: Map<string, string> = null;

export function get(arg: ArgId) {
  if (!args) {
    let query = location.search.slice(1);
    args = parseArgs(query);
  }

  return args.get(arg);
}

export function set(newArgs) {
  for (let arg in newArgs)
    args.set(arg, newArgs[arg]);
  let query = serializeArgs(args);
  log.i('?' + query);
  location.search = '?' + query;
}

function parseArgs(str: string) {
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
  let pairs = [];

  for (let [key, val] of args) {
    let encKey = encodeURIComponent(key);
    let encVal = encodeURIComponent(val);
    pairs.push(encKey + '=' + encVal);
  }

  return pairs.join('&');
}
