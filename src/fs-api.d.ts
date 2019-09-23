export declare interface FS {
  find(path: string): Promise<string[]>;
  dir(path: string): Promise<string[]>;
  get(path: string): Promise<any>;
  mget?<T>(path: string, schema: T):
    Promise<{ [key in keyof T]: any }>;
  set(path: string, data: any): Promise<void>;
}
