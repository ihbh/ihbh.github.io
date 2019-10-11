export async function hasUnreadChats() {
  let vfs = await import('./vfs');
  let user = await import('./user');
  let uid = await user.uid.get();
  let dir = await vfs.root.dir(`/srv/users/${uid}/unread`);
  return dir && dir.length > 0;
}
