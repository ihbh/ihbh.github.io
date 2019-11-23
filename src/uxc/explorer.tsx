import * as page from '../page';
import * as dom from '../dom';
import { TaggedLogger } from '../log';
import * as qargs from '../qargs';
import React from '../react';
import vfs from 'vfs/vfs';

const log = new TaggedLogger('explorer');

const RMDIR_TIMEOUT = 5;
const TAG_LINKS = 'links';

export async function render() {
  return <div id="p-explorer"
    class="page">
    <div class="path">
      <span class="vfs-path"></span>
      <span class="controls"></span>
    </div>
    <div class="data"></div>
  </div>;
}

export async function init() {
  let path = getCurrentVfsPath();
  log.i('Path:', path);

  addRmDirButton();
  addRefreshButton();

  refreshContents();
}

function refreshContents() {
  let path = getCurrentVfsPath();
  let sfc = qargs.get('sfc') == '1';
  let idir = qargs.get('idir');

  dom.id.expVfsPath.textContent = path;
  dom.id.expData.innerHTML = '';

  renderAsFile(path)
    .catch(err => log.w('This is not a file:', err));
  renderAsDir(path, sfc, idir)
    .catch(err => log.w('This is not a dir:', err));
}

function getCurrentVfsPath() {
  return qargs.get('path') || '/';
}

function addRefreshButton() {
  let button: HTMLElement =
    <img src="/icons/refresh.svg"
      title="Refresh contents"></img>;
  dom.id.expControls.append(button);
  button.onclick = () => refreshContents();
}

function addRmDirButton() {
  let path = getCurrentVfsPath();
  let button: HTMLElement =
    <img src="/icons/delete.svg"
      title="Delete this dir"></img>;
  dom.id.expControls.append(button);

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
        reset();
        await vfs.rmdir(path);
      }, 1000);
    }
  };
}

async function renderAsFile(path: string) {
  let root = dom.id.expData;
  if (path.endsWith('/'))
    return;
  log.i('Checking if this is a file.');
  let data = await vfs.get(path);
  if (data === null) return;
  log.i('This is a file.');
  let type = typeof data;
  let json = type == 'string' ?
    data : JSON.stringify(data);
  let div: HTMLElement =
    <div type={type} class="data">{json}</div>;
  makeEditable(div, path);
  root.appendChild(div);
}

function makeEditable(el: HTMLElement, path: string) {
  el.setAttribute('contenteditable', '');
  let prevText = '';
  el.addEventListener('focusin', () => {
    prevText = el.textContent!;
  });
  el.addEventListener('focusout', async () => {
    let newText = el.textContent!;
    if (newText == prevText) return;

    try {
      setFStatus(el, 'updating');
      let type = el.getAttribute('type');
      let newData = type == 'string' ?
        newText : JSON.parse(newText);
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

async function renderAsDir(dirPath: string, sfc: boolean, idir: string) {
  let root = dom.id.expData;
  if (dirPath.endsWith('/'))
    dirPath = dirPath.slice(0, -1);
  log.i('Checking if this is a dir.');
  let names = await vfs.dir(dirPath);
  let links: HTMLElement = <div class={TAG_LINKS}></div>;
  log.i('Show file contents?', sfc);
  if (sfc) links.classList.add('sfc');

  let tags = new Map<string, HTMLElement>();

  let ps = names.map(async name => {
    let path = dirPath + '/' + name;
    let href = page.href('explorer', {
      path,
      sfc: sfc ? 1 : undefined,
      idir: idir ? 1 : undefined,
    });
    let nameTag = <a href={href}>{decodeURIComponent(name)}</a>;
    let dataTag: HTMLElement | null = null;
    let infoTag: HTMLElement | null = null;
    let unitTag: HTMLElement | null = null;

    try {
      if (sfc) {
        let data = await vfs.get(path);
        if (data !== null) {
          let json = JSON.stringify(data);
          dataTag = <i>{json}</i>;
          dataTag!.setAttribute('spellcheck', 'false');
          makeEditable(dataTag!, path);
        }
      }
    } catch { }

    try {
      if (idir) {
        let description = await vfs.stat(path, 'description');
        let units = await vfs.stat(path, 'units');
        if (description)
          infoTag = <s>{description}</s>;
        if (units)
          unitTag = <b>{units}</b>;
      }
    } catch { }

    tags.set(name,
      <div>
        {nameTag}
        {dataTag ? ' = ' : null}
        {dataTag}
        {unitTag ? ' ' : null}
        {unitTag}
        {infoTag}
      </div>);
  });

  await Promise.all(ps);

  for (let name of names.sort())
    links.appendChild(tags.get(name)!);

  root.appendChild(links);
}
