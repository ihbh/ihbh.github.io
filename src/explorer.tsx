import * as dom from './dom';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import React from './react';
import vfs from './vfs';

const log = new TaggedLogger('explorer');

export async function init() {
  let path = qargs.get('path') || '';
  log.i('Path:', path);
  let root = dom.id.pageExplorer;
  root.appendChild(<div class="path">{path || '/'}</div>);

  renderAsFile(root, path).catch(err => log.w('This is not a file:', err));
  renderAsDir(root, path).catch(err => log.w('This is not a dir:', err));
}

async function renderAsFile(root: HTMLElement, path: string) {
  log.i('Checking if this is a file.');
  let data = await vfs.get(path);
  if (data === null) return;
  log.i('This is a file.');
  let json = JSON.stringify(data);
  root.appendChild(<div class="data">{json}</div>);
}

async function renderAsDir(root: HTMLElement, path: string) {
  log.i('Checking if this is a dir.');
  let names = await vfs.dir(path);
  let links = <div class="links"></div>;
  log.i('This is a dir.');

  for (let name of names) {
    let href = `/?page=explorer&path=${path}/${name}`;
    let link = <a href={href}>{name}</a>;
    links.appendChild(link);
  }

  root.appendChild(links);
}
