export declare interface FS {
  get(path: string): Promise<any>;
  set(path: string, data: any): Promise<void>;
}
