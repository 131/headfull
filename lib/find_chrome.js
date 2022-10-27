"use strict";

const fs   = require('fs');
const path = require('path');

function win32(canary) {
  const suffix = canary ?
    `${path.sep}Google${path.sep}Chrome SxS${path.sep}Application${path.sep}chrome.exe` :
    `${path.sep}Google${path.sep}Chrome${path.sep}Application${path.sep}chrome.exe`;

  const prefixes = [
    process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env.ProgramW6432, process.env['PROGRAMFILES(X86)'], '/mnt/c/Program Files/', '/mnt/c/Program Files (x86)/'
  ].filter(Boolean);

  let result;
  for(let prefix of prefixes) {
    const chromePath = path.join(prefix, suffix);
    if(fs.existsSync(chromePath))
      result = chromePath;
  }

  return result;
}

async function findChrome() {
  let executablePath = win32();
  return executablePath;
}


module.exports = findChrome;
