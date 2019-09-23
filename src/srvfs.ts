import { NotImplementedError } from './error';
import { FS } from './fs-api';
import { TaggedLogger } from './log';
import * as rpc from './rpc';

const log = new TaggedLogger('srvfs');

class SrvFS implements FS {
  async find(path: string): Promise<string[]> {
    throw new NotImplementedError;
  }

  async dir(path: string): Promise<string[]> {
    throw new NotImplementedError;
  }

  async get(path: string): Promise<any> {
    return rpc.invoke('RSync.GetFile', path);
  }

  async set(path: string, data): Promise<void> {
    return rpc.invoke('RSync.AddFile', { path, data });
  }
};

export default new SrvFS;
