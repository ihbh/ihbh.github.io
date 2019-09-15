import { TaggedLogger } from "./log";

const log = new TaggedLogger('ls');

export function clear() {
  log.i('clear');
  localStorage.clear();
}

export function save() {
  let json = JSON.stringify(localStorage);
  log.i('save', json);
  return JSON.parse(json);
}

export function load(json) {
  log.i('load', json);
  for (let i in json)
    localStorage.setItem(i, json[i]);
}
