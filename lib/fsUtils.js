'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { promisify } = require('util');

async function* iterateFiles(roots) {
  const queue = [...roots];
  while (queue.length) {
    const fsItemPath = queue.shift();
    const stat = await fsp.lstat(fsItemPath);
    if (stat.isDirectory()) {
      const childFiles = await fsp.readdir(fsItemPath);
      const childFilesPaths = childFiles.map((childFilePath) =>
        path.join(fsItemPath, childFilePath)
      );
      queue.push(...childFilesPaths);
    } else {
      const content = await fsp.readFile(fsItemPath, 'utf-8');
      yield { path: fsItemPath, content };
    }
  }
}

const fspExists = promisify(fs.exists);

module.exports = { iterateFiles, fspExists };
