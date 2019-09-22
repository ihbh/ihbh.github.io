import * as config from './config';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import { AsyncProp } from './prop';

const log = new TaggedLogger('rpc');

export class RpcError extends Error {
  public status: number;

  constructor(
    public method: string,
    public response: Response) {

    super(`RPC ${method} failed: ${response && response.status}`);
    this.status = response && response.status;
  }
}

export interface UserDetails {
  pubkey: string;
  photo: string;
  name: string;
  info: string;
}

export interface VisitedPlace {
  lat: number;
  lon: number;
  time: number;
}

export interface VisitedPlaces {
  [tskey: string]: VisitedPlace;
}

export interface Visitors {
  [uid: string]: any;
}

export interface ChatMessage {
  user: string;
  text: string;
  time: number;
}

export interface RSyncFile {
  path: string;
  data: any;
}

export interface BatchEntry {
  name: string;
  args: any;
}

export interface BatchResult {
  err?: { code: number };
  res?: any;
}

export function invoke(
  method: 'Batch.Run',
  args: BatchEntry[])
  : Promise<BatchResult[]>;

export function invoke(
  method: 'RSync.AddFile',
  args: RSyncFile)
  : Promise<void>;

export function invoke(
  method: 'RSync.GetFile',
  path: string)
  : Promise<any>;

export function invoke(
  method: 'Map.GetVisitors',
  args: { lat: number, lon: number })
  : Promise<Visitors>;

export async function invoke(method: string, args) {
  log.i('invoke:', method, args);
  let user = await import('./user');

  let path = '/rpc/' + method;
  let url = (await rpcurl.get()) + path;
  let body = JSON.stringify(args);
  let uid = await user.uid.get();
  let sig = await user.sign(path + '\n' + body);

  let headers = {
    'Authorization': JSON.stringify({ uid, sig }),
    'Content-Type': 'application/json',
    'Content-Length': body.length + '',
  };

  await new Promise(resolve =>
    setTimeout(resolve, config.RPC_DELAY * 1000));

  try {
    let res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'error',
      referrer: 'no-referrer',
      headers,
      body,
    });

    if (!res.ok)
      throw new RpcError(method, res);

    let text = await res.text();
    let json = text ? JSON.parse(text) : null;
    log.i(res.status, json);
    return json;
  } catch (err) {
    if (err instanceof RpcError)
      throw err;
    log.e('fetch() failed:', err);
    throw new RpcError(method, null);
  }
}

let rpcurl = new AsyncProp<string>(() => {
  let url = qargs.get('rpc')
    || config.DEFAULT_RPC_URL;

  if (url.indexOf('://') < 0) {
    let scheme = config.DEBUG ? 'http' : 'https';
    url = scheme + '://' + url;
  }

  if (!/:\d+$/.test(url))
    url = url + ':' + config.DEFAULT_RPC_PORT;

  log.i('RPC URL:', url);
  return url;
});
