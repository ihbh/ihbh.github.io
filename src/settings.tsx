import * as page from './page';
import * as conf from './config';
import * as dom from './dom';
import * as idb from './idb';
import { TaggedLogger } from './log';
import * as ls from './ls';
import React from './react';

const log = new TaggedLogger('settings');

export async function render() {
  return <div id="p-settings"
    class="page">
    <div class="controls">
      <button id="export-db"
        class="btn-sq"
        style="background-image: url(/icons/download.svg)">
        Export
      </button>
      <button id="import-db"
        class="btn-sq"
        style="background-image: url(/icons/upload.svg)">
        Import
      </button>
      <button id="vfs-explorer"
        class="btn-sq"
        href={page.href('explorer')}
        style="background-image: url(/icons/storage.svg)">
        VFS
      </button>
      <button id="config"
        class="btn-sq"
        href={page.href('explorer', { sfc: 1, idir: 1, path: '/conf' })}
        style="background-image: url(/icons/config.svg)">
        Config
      </button>
      <button id="feedback"
        class="btn-sq"
        href={page.href('feedback')}
        style="background-image: url(/icons/upvote.svg)">
        Feedback
      </button>
    </div>
  </div>;
}

export async function init() {
  initExportButton();
  initImportButton();
}

function initExportButton() {
  dom.id.exportDB.addEventListener('click', async () => {
    log.i('Exporting data...');
    try {
      let json = {
        ls: await ls.save(),
        idb: await idb.save(name => name != conf.LOG_IDB_NAME),
      };

      let blob = new Blob(
        [JSON.stringify(json, null, 2)],
        { type: 'application/json' });

      let a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = conf.DBG_DATA_FILENAME;
      a.click();

      log.i('Data exported.');
    } catch (err) {
      log.e('Failed to export data:', err);
    }
  });
}

function initImportButton() {
  dom.id.importDB.addEventListener('click', async () => {
    log.i('Importing data...');
    try {
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.click();

      log.i('Waiting for input.onchange...');
      let file = await new Promise<File>((resolve, reject) => {
        input.onchange = () => {
          if (input.files.length == 1)
            resolve(input.files[0]);
          else
            reject(new Error('One file must have been selected.'));
        };
      });

      log.i('selected file:', file.type, file.size, 'bytes');
      let res = await fetch(URL.createObjectURL(file));
      let json = await res.json();
      log.i('importing json:', json);

      log.i('Deleting the old data...');
      await ls.clear();
      await idb.clear();

      json.ls && await ls.load(json.ls);
      json.idb && await idb.load(json.idb);

      log.i('Data imported.');
    } catch (err) {
      log.e('Failed to import data:', err);
    }
  });
}