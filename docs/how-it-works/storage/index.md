# What this app stores and where

All the data is stored locally in `indexedDB` and `localStorage`. Thise includes X25519 keys, visited places, sent and received messages,cached data, various notes and so on. You can explore this data with the VFS button on the settings page:

![](/docs/img/pages/vfs-1.jpg)

There are three main components here:

- `/idb` represents `indexedDB` where almost all the data is stored.
- `/ls` represents `localStorage` that keeps a few config values.
- `/srv` represents the server.

The rest are aliases. For example `/home` is an alias to `/idb/user`.

One `indexedDB` table stores all user account data and it's possible to create other tables and thus have multiple user accounts. The default table name is `user`. At the beginning, the app creates a few props:

![](/docs/img/pages/vfs-2.jpg)

- `pubkey` is the X25519 public key.
- `id` is the hash of `pubkey`

The private key is kept in `/idb/user/local/keys/privkey`.

The `/idb/user/shared` dir is synced with the server's copy at `/srv/users/<uid>/` and you can see what's stored on the server:

![](/docs/img/pages/vfs-3.jpg)

The visited places go to `/home/shared/places` (and thus are also synced with the server). The sent chat messages go to `/home/shared/chats`.
