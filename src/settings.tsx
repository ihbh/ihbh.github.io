import * as conf from './config';
import * as dom from './dom';
import * as idb from './idb';
import { TaggedLogger } from './log';
import * as ls from './ls';
import * as page from './page';

const log = new TaggedLogger('settings');

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