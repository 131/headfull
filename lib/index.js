"use strict";

const fs    = require('fs');
const {spawn} = require('child_process');
const path  = require('path');

const puppeteer = require('puppeteer-core');


const getPort = require('nyks/net/getPort');
const mkdirpSync = require('nyks/fs/mkdirpSync');
const rmrf       = require('nyks/fs/rmrf');
const tmppath    = require('nyks/fs/tmppath');

const fetch       = require('nyks/http/fetch');
const retryUntil  = require('nyks/async/retryUntil');


const findChrome = require('./find_chrome');



let templates = {
  'Local State' : `{"browser":{"enabled_labs_experiments":["overscroll-history-navigation@2"],"last_redirect_origin":""}}`,
};


class Page {

  constructor(child, page) {
    this.child = child;
    this.page  = page;
  }

  close() {
    this.child.kill();
  }

  static async _initDir() {
    let root = tmppath();
    mkdirpSync(root);
    for(let file_name in templates) {
      let file_contents = templates[file_name];
      let file_path = path.join(root, file_name);
      mkdirpSync(path.dirname(file_path));
      fs.writeFileSync(file_path, file_contents);
    }
    return root;
  }


  static async open(remote_url, options = {}) {

    let root = await Page._initDir();

    var executablePath = await findChrome();
    let port = await getPort();

    let args = [
      `--remote-debugging-port=${port}`,
      `--app=${remote_url}`,
      //`--app=data:text/html,<title>foo</title>`, //
      //`--kiosk`,

      '--bwsi',
      `--user-data-dir=${root}`,

      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-features=Translate',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-first-run',
      '--mute-audio',
      '--disable-pinch',
      '--disable-session-crashed-bubble',
      '--overscroll-history-navigation=0',
      '--disable-infobars',
      '--safebrowsing-disable-auto-update',
      '--ignore-gpu-blacklist',
      '--num-raster-threads=2',
      '--no-default-browser-check',
      '--disable-usb-keyboard-detect',
    ];

    if('x' in options && 'y' in options)
      args.push(`--window-position=${options.x},${options.y}`);
    if('width' in options && 'height' in options)
      args.push(`--window-size=${options.width},${options.height}`);

    let child = spawn(executablePath, args, {env : {...process.env,
      GOOGLE_API_KEY               : 'no',
      GOOGLE_DEFAULT_CLIENT_ID     : 'no',
      GOOGLE_DEFAULT_CLIENT_SECRET : 'no',
    }});

    child.on('exit', async function() {
      await rmrf(root);
    });

    let browserURL = `http://localhost:${port}`;

    await retryUntil(async () => {
      try {
        return await fetch(`${browserURL}/json/version`);
      } catch(err) {
        return false;
      }
    }, 10 * 1000, 100);

    const browser = await puppeteer.connect({browserURL});

    let pages = await browser.pages();
    let page = pages[0];

    await page.waitForNavigation({waitUntil : 'load'});             // consider navigation to be finished when the load event is fired.
    await page._client.send('Emulation.clearDeviceMetricsOverride');//allow resize

    return new Page(child, page);
  }

}


module.exports = Page;

