import { TaggedLogger } from "./log";
import * as rpc from './rpc';

const log = new TaggedLogger('usr');

export async function setDetails(details: rpc.UserDetails) {
  log.i('details:', details);
  await rpc.invoke('Users.SetDetails', details, true);
}
