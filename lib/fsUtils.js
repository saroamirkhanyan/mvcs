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

async function deepWriteFile({ cache, base, filePath, content }) {
	const filePathChunks = filePath.split('/');
	let currentBasePath = base;	
	for(const parentDirName of filePathChunks.slice(0, -1)) {
		const dirAbsPath = path.join(currentBasePath, parentDirName);
		if(!cache.has(dirAbsPath)) {
			await fsp.mkdir(dirAbsPath);
			cache.add(dirAbsPath);
		};
		currentBasePath = dirAbsPath;
	}
	const fileName = filePathChunks.at(-1);
	fsp.writeFile(path.join(currentBasePath, fileName), content);
}


async function emptyDir(dirPath) {
	for(const fsItemName of await fsp.readdir(dirPath)) {
		const fsItemAbsPath = path.join(dirPath, fsItemName);
		const fsItemStat = await fsp.stat(fsItemAbsPath);
		await fsp.rm(fsItemAbsPath, { recursive: true });
	}
}

module.exports = { 
	iterateFiles,
	exists: promisify(fs.exists), 
	deepWriteFile,
	emptyDir
};
