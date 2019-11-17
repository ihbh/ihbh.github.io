# Virtual File System

This idea from Linux appears to work well in web: it can unify very different data mediums, such as `localStorage`, `indexedDB` and the RPC server, under the same interface. In the VFS world, setting the dark mode flag and sending a chat message is about the same operation:

```js
await vfs.set(
  '/conf/ui/dark-mode',
  1);

await vfs.set(
  `/home/shared/chats/${uid}/${time}`,
  'Howdy');
```

Under the hood, `/home` appears to be a symlink to `/idb/u001` where `/idb` refers to `indexedDB` and `u001` refers to a table in IDB; and `/conf` is a symlink to `/ls/conf`, where `/ls` is `localStorage`. Nothing stops us from remapping `/home` to `/idb/u002`. Moreover, `/home/shared` can be synced in background with `/srv/users/<uid>`, yet another VFS dir with the same interface, but under the hood, all VFS operations to `/srv` are implemented as RPC calls to the server.
