import * as config from './config';
import { TaggedLogger } from './log';
import * as ls from './ls';
import * as qargs from './qargs';

const log = new TaggedLogger('rpc');

let sending = false;

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

export interface SharedLocation {
  lat: number;
  lon: number;
  time: number;
}

export interface ChatMessage {
  user: string;
  text: string;
  time: number;
}

export function invoke(
  method: 'Chat.GetMessages',
  args: { user: string, time?: number })
  : Promise<ChatMessage[]>;

export function invoke(
  method: 'Chat.SendMessage',
  args: { user: string, text: string, time: number },
  retry?: boolean,
): Promise<void>;

export function invoke(
  method: 'Users.SetDetails',
  args: UserDetails,
  retry: boolean)
  : Promise<void>;

export function invoke(
  method: 'Users.GetDetails',
  args: { users: string[], props?: string[] })
  : Promise<UserDetails[]>;

export function invoke(
  method: 'Map.ShareLocation',
  args: SharedLocation,
  retry: boolean)
  : Promise<{}>;

export function invoke(
  method: 'Map.GetPeopleNearby',
  args: { lat: number, lon: number })
  : Promise<string[]>;

export async function invoke(method: string, args, retry?: boolean) {
  log.i('invoke:', method, args, 'retry?', retry);
  if (retry) await schedule(method, args);

  let user = await import('./user');

  let path = '/rpc/' + method;
  let url = getRpcUrl() + path;
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

  url = url.replace('/User.', '/Users.');

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
    log.e('fetch() failed:', err);
    throw new RpcError(method, null);
  }
}

async function schedule(method: string, args) {
  log.i('schedule:', method, args);

  let sha1 = await import('./sha1' as any);
  let info: ls.RpcInfo = { method, args };
  let id = sha1(JSON.stringify(info)).slice(0, 6);

  ls.rpcs.infos.modify(infos => {
    infos[id] = info;
    return infos;
  });

  ls.rpcs.unsent.modify(unsent => {
    unsent[id] = Date.now() / 1000 | 0;
    return unsent;
  });
}

export async function sendall() {
  let unsent = ls.rpcs.unsent.get();
  let infos = ls.rpcs.infos.get();

  if (sending) throw new Error('Still sending.');
  log.i('sending unsent:', Object.keys(unsent).length);
  sending = true;

  try {
    for (let id of Object.keys(unsent)) {
      try {
        let { method, args } = infos[id];
        await invoke(method as any, args);

        ls.rpcs.unsent.modify(unsent => {
          delete unsent[id];
          return unsent;
        });

        ls.rpcs.infos.modify(infos => {
          delete infos[id];
          return infos;
        });
      } catch (err) {
        let retry = err instanceof RpcError &&
          (!err.status || err.status >= 500);

        if (retry) {
          log.i('will be resent later:', id, infos[id].method);
        } else {
          ls.rpcs.unsent.modify(unsent => {
            delete unsent[id];
            return unsent;
          });

          ls.rpcs.failed.modify(errs => {
            errs[id] = err.message;
            return errs;
          });
        }
      }
    }
  } finally {
    sending = false;
    log.i('still unsent rpcs:', Object.keys(unsent).length);
  }
}

function getRpcUrl() {
  let url = qargs.get('rpc');
  if (!url) return config.DEFAULT_RPC_URL;

  if (url.indexOf('://') < 0) {
    let scheme = config.DEBUG ? 'http' : 'https';
    url = scheme + '://' + url;
  }

  if (!/:\d+$/.test(url))
  url = url + ':' + config.DEFAULT_RPC_PORT;

  return url;
}
