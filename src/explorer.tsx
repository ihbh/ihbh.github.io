import * as dom from './dom';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import React from './react';
import vfs from './vfs';

const log = new TaggedLogger('explorer');

const RMDIR_TIMEOUT = 7;
const TAG_LINKS = 'links';

export async function init() {
  let path = getCurrentVfsPath();
  log.i('Path:', path);
  let root = dom.id.pageExplorer;
  let controls = <span class="controls"></span>;

  root.appendChild(
    <div class="path">
      {controls} {path}
    </div>);

  addRmDirButton(controls);

  renderAsFile(root, path)
    .catch(err => log.w('This is not a file:', err));

  renderAsDir(root, path)
    .catch(err => log.w('This is not a dir:', err));
}

function getCurrentVfsPath() {
  return qargs.get('path') || '/';
}

function addRmDirButton(controls: HTMLElement) {
  let path = getCurrentVfsPath();
  let button: HTMLElement = <span title="Delete the entire dir">[x]</span>;
  controls.prepend(button);

  let timer = 0;
  let remaining = 0;

  const reset = () => {
    clearInterval(timer);
    timer = 0;
    remaining = 0;
    button.textContent = `[x]`;
  };

  const update = () => {
    button.textContent = `[Deleting the dir in ${remaining} seconds]`;
  };

  button.onclick = () => {
    if (timer) {
      log.i('Canceling the rmdir timer.');
      reset();
    } else {
      remaining = RMDIR_TIMEOUT;
      update();
      log.i('Started the rmdir timer.');
      timer = setInterval(async () => {
        remaining--;
        update();
        if (remaining)
          return;
        reset();
        await vfs.rmdir(path);
      }, 1000);
    }
  };
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
  let links = <div class={TAG_LINKS}></div>;
  log.i('This is a dir.');

  for (let name of names) {
    let href = `/?page=explorer&path=${path}/${name}`;
    let link = <a href={href}>{name}</a>;
    links.appendChild(link);
  }

  root.appendChild(links);
}
