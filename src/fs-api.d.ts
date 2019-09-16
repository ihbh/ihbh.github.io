export declare interface FS {
  dir(path: string): Promise<string[]>;
  get(path: string): Promise<any>;
  set(path: string, data: any): Promise<void>;
}
