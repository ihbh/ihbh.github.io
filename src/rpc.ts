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

export interface VisitorNote {
  uid: string;
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

export interface RSyncResult {
  err?: { status: number };
  res?: any;
}

export function invoke(
  method: 'RSync.AddFiles',
  args: RSyncFile[])
  : Promise<RSyncResult[]>;

export function invoke(
  method: 'Chat.GetMessages',
  args: { user: string, time?: number })
  : Promise<ChatMessage[]>;

export function invoke(
  method: 'Users.SetDetails',
  args: UserDetails)
  : Promise<void>;

export function invoke(
  method: 'Users.GetDetails',
  args: { users: string[], props?: string[] })
  : Promise<UserDetails[]>;

export function invoke(
  method: 'Map.GetVisitedPlaces',
  args: void)
  : Promise<VisitedPlaces>;

export function invoke(
  method: 'Map.AddVisitedPlaces',
  args: VisitedPlaces)
  : Promise<void>;

export function invoke(
  method: 'Map.GetVisitors',
  args: { lat: number, lon: number })
  : Promise<VisitorNote[]>;

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
