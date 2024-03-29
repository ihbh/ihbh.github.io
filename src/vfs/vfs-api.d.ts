export declare interface VFS {
  invoke?(fsop: keyof VFS, path: string, ...args): Promise<any>;
  find?(path: string): Promise<string[]>;
  dir?(path: string): Promise<string[]>;
  get?(path: string): Promise<any>;
  set?(path: string, data: any): Promise<void>;
  rm?(path: string): Promise<void>;
  rmdir?(path: string): Promise<void>;
  stat?(path: string, prop: string): Promise<any>;
}
