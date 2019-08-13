import * as config from './config';
import { TaggedLogger } from './log';

export const MAP_SHARE_LOCATION = 'Map.ShareLocation';

const log = new TaggedLogger('rpc');

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
  let url = `${config.RPC_URL}/rpc/${method}`;
  log.i(url, args);

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
