import * as conf from './config';
import * as idb from './idb';
import { TaggedLogger } from './log';
import * as ls from './ls';
import sleep from './sleep';

const log = new TaggedLogger('impexp');

export async function exportData() {
  try {
    log.i('Exporting data...');
    let ts = Date.now();

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
    document.body.appendChild(a); // Required for Firefox.
    a.click();
    a.remove();

    log.i('Data exported in', Date.now() - ts, 'ms',
      (blob.size / 1024).toFixed(1), 'KB', a.href);
  } catch (err) {
    log.e('Failed to export data:', err);
  }
}

export async function importData() {
  try {
    log.i('Importing data...');
    let ts = Date.now();

    let input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.click();

    log.i('Waiting for input.onchange...');
    let file = await new Promise<File>((resolve, reject) => {
      input.onchange = () => {
        if (input.files?.length == 1)
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

    log.i('Waiting for IDB connection to close.');
    await sleep(1500);

    json.ls && await ls.load(json.ls);
    json.idb && await idb.load(json.idb);

    log.i('Data imported in', Date.now() - ts, 'ms');
  } catch (err) {
    log.e('Failed to import data:', err);
  }
}
