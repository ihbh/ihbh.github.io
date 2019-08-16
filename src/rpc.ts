import * as config from './config';
import { TaggedLogger } from './log';
import * as ls from './ls';

export const MAP_SHARE_LOCATION = 'Map.ShareLocation';
export const USER_SET_DETAILS = 'User.SetDetails';

const log = new TaggedLogger('rpc');

let sending = false;

export class RpcError extends Error {
  public status: number;

  constructor(
    public method: string,
    public response: Response) {

    super(`RPC ${method} failed: ${response.status}`);
    this.status = response.status;
  }
}

export async function invoke(method: string, args) {
  log.i('invoke:', method, args);

  let url = `${config.RPC_URL}/rpc/${method}`;

  await new Promise(resolve =>
    setTimeout(resolve, config.RPC_DELAY * 1000));

  let res = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'error',
    referrer: 'no-referrer',
    body: JSON.stringify(args),
  });

  if (!res.ok)
    throw new RpcError(method, res);

  let json = await res.json();
  log.i(res.status, json);
  return json;
}

export async function schedule(method: string, args) {
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
        await invoke(method, args);

        ls.rpcs.unsent.modify(unsent => {
          delete unsent[id];
          return unsent;
        });

        ls.rpcs.infos.modify(infos => {
          delete infos[id];
          return infos;
        });
      } catch (err) {
        if (err instanceof RpcError && err.response.status >= 500) {
          log.i('will be resent later:', id);
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
