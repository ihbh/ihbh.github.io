import * as conf from './config';
import * as dom from './dom';
import { TaggedLogger } from './log';
import * as page from './page';
import { isRegistered } from './usr';

const log = new TaggedLogger('index');

dom.whenLoaded().then(async () => {
  log.i('location.href:', location.href);

  log.i('Debug mode?', conf.DEBUG);
  conf.DEBUG && import('dbg')
    .then(dbg => dbg.init());

  import('darkmode')
    .then(dm => dm.init());

  await page.init();
  await showCorrectPage();

  import('pwa')
    .then(pwa => pwa.init());
  import('startup')
    .then(su => su.run());
}).catch(err => {
  log.e('failed:', err);
}).then(() => {
  log.i('Time:', Date.now() - window['gtime0'], 'ms');
});


async function showCorrectPage() {
  let registered = await isRegistered();
  log.i('user registered?', registered);

  if (!registered) {
    if (page.get() == 'profile')
      await page.refresh();
    else
      await page.set('profile');
  } else {
    await page.refresh();
  }
}
