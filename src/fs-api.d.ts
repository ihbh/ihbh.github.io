export declare interface FS {
  find(path: string): Promise<string[]>;
  dir(path: string): Promise<string[]>;
  get(path: string): Promise<any>;
  set(path: string, data: any): Promise<void>;
}
