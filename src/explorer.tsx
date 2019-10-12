import * as dom from './dom';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import React from './react';
import vfs from './vfs';
import * as page from './page';

const log = new TaggedLogger('explorer');

const RMDIR_TIMEOUT = 5;
const TAG_LINKS = 'links';

export async function init() {
  let path = getCurrentVfsPath();
  let sfc = qargs.get('sfc') == '1';
  log.i('Path:', path);
  let root = dom.id.pageExplorer;
  let controls = <span class="controls"></span>;

  root.appendChild(
    <div class="path">
      {controls}
      {path}
    </div>);

  addRmDirButton(controls);

  renderAsFile(root, path)
    .catch(err => log.w('This is not a file:', err));

  renderAsDir(root, path, sfc)
    .catch(err => log.w('This is not a dir:', err));
}

function getCurrentVfsPath() {
  return qargs.get('path') || '/';
}

function addRmDirButton(controls: HTMLElement) {
  let path = getCurrentVfsPath();
  let button: HTMLElement =
    <span class="rmdir" title="Delete the entire dir">
      [x]
    </span>;
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
    button.textContent = `[${remaining}...]`;
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
        await vfs.rmdir(path);
        reset();
      }, 1000);
    }
  };
}

async function renderAsFile(root: HTMLElement, path: string) {
  if (path.endsWith('/'))
    return;
  log.i('Checking if this is a file.');
  let data = await vfs.get(path);
  if (data === null) return;
  log.i('This is a file.');
  let json = JSON.stringify(data);
  let div: HTMLElement = <div class="data">{json}</div>;
  makeEditable(div, path);
  root.appendChild(div);
}

function makeEditable(el: HTMLElement, path: string) {
  el.setAttribute('contenteditable', '');
  let prevText = '';
  el.addEventListener('focusin', () => {
    prevText = el.textContent;
  });
  el.addEventListener('focusout', async () => {
    let newText = el.textContent;
    if (newText == prevText) return;

    try {
      setFStatus(el, 'updating');
      let newData = JSON.parse(newText);
      await vfs.set(path, newData);
      prevText = newText;
      setFStatus(el, 'updated');
    } catch (err) {
      log.w('Failed to update file:', err);
      setFStatus(el, 'failed');
    }
  });
}

function setFStatus(el: HTMLElement, status: 'updating' | 'updated' | 'failed') {
  el.setAttribute('fstatus', status);
}

async function renderAsDir(root: HTMLElement, dirPath: string, sfc: boolean) {
  if (dirPath.endsWith('/'))
    dirPath = dirPath.slice(0, -1);
  log.i('Checking if this is a dir.');
  let names = await vfs.dir(dirPath);
  let links: HTMLElement = <div class={TAG_LINKS}></div>;
  log.i('Show file contents?', sfc);

  let fdata = new Map<string, string>();

  if (sfc) {
    links.classList.add('sfc');
    let ps = names.map(async name => {
      try {
        let data = await vfs.get(dirPath + '/' + name);
        if (data === null) return;
        let json = JSON.stringify(data);
        fdata.set(name, json);
      } catch { }
    });
    await Promise.all(ps);
  }

  for (let name of names.sort()) {
    let fullpath = encodeURIComponent(dirPath + '/' + name);
    let href = `/?page=explorer&path=${fullpath}`;
    if (sfc) href += '&sfc=1';
    let nameTag = <a href={href}>{name}</a>;
    let dataTag: HTMLElement = null;

    if (fdata.has(name)) {
      dataTag = <i>{fdata.get(name)}</i>;
      dataTag.setAttribute('spellcheck', 'false');
      makeEditable(dataTag, dirPath + '/' + name);
    }

    links.appendChild(
      <div>
        {nameTag}
        {dataTag}
      </div>);
  }

  root.appendChild(links);
}
