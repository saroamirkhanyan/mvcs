'use strict';
const fsp = require('fs/promises');
const fetch = require('node-fetch');
const fsUtils = require('./lib/fsUtils.js');
const MetaxAPI = require('./lib/metax.js');
const Store = require('./lib/store.js');
const MVCS = require('./lib/mvcs.js');

const metaxAPI = new MetaxAPI({ fetch });
const store = new Store(metaxAPI);

class NodeMVCS extends MVCS {
  constructor({ store, cwd }) {
    super({ store });
    this.store = store;
    this.cwd = cwd;
    this.repoId = null;
    this.loadRepoId();
  }

  async loadRepoId() {
    const repoExists = await fsUtils.fspExists('.mvcs');
    if (repoExists) {
      this.repoId = await fsp.readFile('.mvcs');
    }
  }

  requireRepo() {
    if (!this.repoId) {
      console.error('Repository not found!');
      return false;
    }
    return true;
  }

  async init() {
    if (this.repoId) {
      console.error('Repository already exists');
      return;
    }
    const repoId = await super.init();
    console.log(repoId);
  }
}

const nodemvcs = new NodeMVCS({
  store,
  cwd: process.cwd(),
});

const commands = {
  init() {
    nodemvcs.init();
  },
};

commands[process.argv[2]]();

/*;(() => {
	const isRepoInited = await fspExists('.mvcs');
	let repoId;
	if(isRepoInited) {
		repoId = fs.readFile(".mvcs");
	}
})();*/

/*;(() =>{
	const isRepoInited = await fspExists('.mvcs');

	let repoId;

	if(isRepoInited) {
		repoId = fs.readFile(".mvcs");
	}
});

const isRepoInited = await fspExists('.mvcs');

let repoId;

if(isRepoInited) {
	repoId = fs.readFile(".mvcs");
}

function checkRepo() {
	if(isRepoInited) {
		console.error("Repository is not found");
		return false;
	}
	return true;
}

const commands = {
	async save() {
		if(checkRepo) return;
		save(repoId);
	},
	checkout() {
	},
	async init() {
		const dir = await fsp.readdir('.');
		if(dir.includes('.mvcs')) {
			throw new Error("Repository already exsits");
		}
		repoId = init();
		fsp.writeFile(".mvcs", repoId);
	},
	async repojson() {
		const depth = 5;
		const result = await store.load(repoId, { depth });
		console.dir(result, { depth });
	}
}

commands[process.argv[2]]();*/
