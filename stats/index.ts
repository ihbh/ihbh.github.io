/// <reference path="svg.ts" />

const SRV_URL = 'https://data.ihbh.org:3921';

async function init() {
  console.log('Started');
  try {
    let srv = SRV_URL;
    console.log('Data server:', srv);
    document.title += ' - ' + srv;
    let prefix = location.hash.slice(1) || '';
    let baseUrl = srv + '/stats/' + prefix;
    let rsp = await fetch(baseUrl);
    let json = await rsp.json();
    let statNames = Object.keys(json).sort();
    for (let statName of statNames) {
      console.log('Working on stat', statName);
      let div = document.createElement('div');
      document.body.appendChild(div);
      div.className = 'stat';
      let [stime, nreqs] = json[statName];
      let svg = makeSvg(stime, nreqs);
      div.innerHTML += `
        <a href="${srv + '/stats/' + statName}">
          ${statName}</a>`;
      div.innerHTML += svg;
    }
  } catch (err) {
    console.error('Failed:', err);
  }
}

window.onload = () => init();
