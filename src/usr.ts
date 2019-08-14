import { TaggedLogger } from "./log";
import * as rpc from './rpc';

const log = new TaggedLogger('usr');

export interface UserDetails {
  photo?: string;
  name?: string;
  info?: string;
}

export async function setDetails(details: UserDetails) {
  log.i('details:', details);
  await rpc.invoke(rpc.USER_SET_DETAILS, details);
}
