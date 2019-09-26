import * as config from './config';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import { AsyncProp } from './prop';

const log = new TaggedLogger('rpc');

let pending: PendingRpc[] = [];
let pbtimer = 0;

interface PendingRpc {
  name: string;
  args: any;
  reqid: string;
  resolve(res): any;
  reject(err): any;
}

interface RpcErrorResponse {
  status: number;
  message?: string;
  description?: string;
}

export class RpcError extends Error {
  public status: number;

  constructor(
    public method: string,
    public response: RpcErrorResponse) {

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

export interface RSyncFile {
  path: string;
  data: any;
}

export interface BatchEntry {
  name: string;
  args: any;
}

export interface BatchResult {
  res?; any;
  err?: {
    code: number;
    message?: string;
    description?: string;
  };
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
  method: 'RSync.Dir',
  path: string)
  : Promise<string[]>;

export function invoke(
  method: 'Map.GetVisitors',
  args: { lat: number, lon: number })
  : Promise<Visitors>;

export async function invoke(method: string, args) {
  let reqid = genRequestId();
  if (method != 'Batch.Run')
    return schedule(method, args, reqid);
  return invokeInternal(method, args, reqid);
}

async function invokeInternal(method: string, args, reqid: string) {
  log.i(reqid, method, args);
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
    log.i(reqid, 'result:', json);
    return json;
  } catch (err) {
    log.w(reqid, 'error:', err);
    if (err instanceof RpcError)
      throw err;
    throw new RpcError(method, null);
  }
}

function schedule(name: string, args, reqid: string) {
  return new Promise((resolve, reject) => {
    pending.push({
      name,
      args,
      reqid,
      resolve,
      reject
    });
    pbtimer = pbtimer || setTimeout(
      sendPendingBatch,
      config.RPC_BATCH_DELAY);
  });
}

async function sendPendingBatch() {
  pbtimer = 0;
  if (!pending.length) return;
  log.d('Prepairing to send a batch:', pending.length);

  let batch = pending.splice(0);

  if (batch.length == 1) {
    log.d('The batch has only 1 rpc.');
    let { name, args, reqid, resolve, reject } = batch[0];
    await invokeInternal(name, args, reqid)
      .then(resolve, reject);
    return;
  }

  let args = batch.map(b => {
    return {
      name: b.name,
      args: b.args
    };
  });

  try {
    let results = await invoke('Batch.Run', args);
    log.d('Parsing batch results:', batch.length);

    for (let i = 0; i < batch.length; i++) {
      let { res, err } = results[i];
      let { name, reqid, resolve, reject } = batch[i];

      if (!err) {
        resolve(res);
        continue;
      }

      let rpcerr = new RpcError(name, {
        status: err.code,
        message: err.message,
        description: err.description,
      });

      reject(rpcerr);
    }
  } catch (err) {
    log.w('The entire batch failed:', err);
    for (let { reject } of batch) {
      reject(err instanceof RpcError ?
        err : new RpcError('Batch.Run', null));
    }
  }
}

function genRequestId() {
  let id = '';
  while (id.length < 8)
    id += Math.random().toString(16).slice(2);
  return id.slice(-8);
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
