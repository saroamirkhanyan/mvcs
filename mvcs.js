'use strict';

const fetch = require('node-fetch');
const MetaxAPI = require('./lib/metax.js');
const Store = require('./lib/store.js');
const NodeMVCS = require('./lib/nodemvcs.js');

const metaxAPI = new MetaxAPI({
  fetch,
});

const store = new Store(metaxAPI);

(async () => {
  const nodemvcs = await new NodeMVCS({
    store,
    cwd: process.cwd(),
  });
  // :TODO Add error handling
  // :TODO Add usage command
  const commands = {
    create() {
      nodemvcs.create();
    },
    save() {
      const commitId = nodemvcs.save();
      if (commitId) {
        console.log('COMMIT', commitId);
      } else {
        console.error('No changes to commit');
      }
    },
    async repojson() {
      const depth = Infinity;
      const result = await store.load(nodemvcs.repoId, { depth });
      console.dir(result, { depth });
    },
    checkout(commitId) {
      if (!commitId) throw new Error('Commit id expected!');
      nodemvcs.checkout(commitId);
    },
  };
  const args = process.argv;
  commands[args[2]](args[3]);
})();
