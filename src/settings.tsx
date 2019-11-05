import * as dom from './dom';
import * as page from './page';
import React from './react';

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
  dom.id.exportDB.addEventListener('click', async () => {
    let { exportData } = await import('./impexp');
    await exportData();
  });
  dom.id.importDB.addEventListener('click', async () => {
    let { importData } = await import('./impexp');
    await importData();
  });
}