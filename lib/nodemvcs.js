'use strict';
const os = require('os');
const fsp = require('fs/promises');
const path = require('path');
const fsUtils = require('./fsUtils.js');
const MVCS = require('./mvcs.js');

class NodeMVCS extends MVCS {
  constructor({ store, cwd }) {
    super({ store });
    this.store = store;
    this.cwd = cwd;
    this.repoId = null;
    this.configPath = path.join(this.cwd, '.mvcs');
    return this.#init();
  }

  async #init() {
    await this.loadRepoId();
    return this;
  }

  async loadRepoId() {
    const repoExists = await fsUtils.exists('.mvcs');
    if (repoExists) {
      this.repoId = await fsp.readFile(this.configPath, 'utf-8');
    }
  }

  requireRepo() {
    if (!this.repoId) {
      throw new Error('Repository not found!');
    }
  }

  async create() {
    this.repoId = await super.create();
    console.log('CREATE', this.repoId);
    fsp.writeFile(this.configPath, this.repoId);
  }

  async save() {
    this.requireRepo();
    const filesIterator = fsUtils.iterateFiles(['.']);
    return super.save({ repoId: this.repoId, filesIterator });
  }

  async checkout(commitId) {
    this.requireRepo();
    const appPrefix = 'mvcs';
    const cache = new Set();
    const tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), appPrefix));
    for await (const file of super.checkout(commitId)) {
      console.log('ADD', file.path);
      await fsUtils.deepWriteFile({
        cache,
        base: tmpDirPath,
        filePath: file.path,
        content: file.content,
      });
    }
    /*
     * :TODO There is no any reason to delete directory
     * which then will be created
     * */
    await fsUtils.emptyDir(this.cwd);
    const cwdDirName = this.cwd.split('/').at(-1);
    for (const fsItem of await fsp.readdir(tmpDirPath)) {
      const oldFsItemPath = path.join(tmpDirPath, fsItem);
      const newFsItemPath = path.join(this.cwd, fsItem);
      console.log('MV', `TEMP/${fsItem}`, path.join(cwdDirName, fsItem));
      await fsp.rename(oldFsItemPath, newFsItemPath);
    }
    await fsp.rm(tmpDirPath, { recursive: true });
  }
}

module.exports = NodeMVCS;
