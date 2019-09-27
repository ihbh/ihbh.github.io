import { NotImplementedError } from './error';
import { FS } from './fs-api';
import * as rpc from './rpc';

class SrvFS implements FS {
  async find(path: string): Promise<string[]> {
    throw new NotImplementedError;
  }

  async dir(path: string): Promise<string[]> {
    return rpc.invoke('RSync.Dir', path);
  }

  async get(path: string): Promise<any> {
    return rpc.invoke('RSync.GetFile', path);
  }

  async set(path: string, data): Promise<void> {
    return rpc.invoke('RSync.AddFile', { path, data });
  }
};

export default new SrvFS;
