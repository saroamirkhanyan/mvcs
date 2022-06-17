'use strict';
class MVCS {
  constructor({ store }) {
    this.store = store;
  }
  async getSplittedPrevFile({ repo, filePath }) {
    const lines = [];
    const queue = [repo.head];
    while (queue.length) {
      const commit = queue.shift();
      const changes = commit.changes[filePath];
      if (changes) {
        for (const change of changes) {
          if (!lines[change.line]) {
            lines[change.line] = change.content;
          }
        }
      }
      if (commit.prev) {
        const prev = await this.store.get(commit.prev);
        queue.push(prev);
      }
    }
    return lines;
  }
  async diff({ repo, file }) {
    const splittedFile = file.content.split(/\r?\n/);
    const splittedPrevFile = await this.getSplittedPrevFile({
      repo,
      filePath: file.path,
    });
    const changes = [];
    for (var i = 0; i < splittedFile.length; i++) {
      const line = splittedFile[i];
      if (line !== splittedPrevFile[i]) {
        changes.push({ line: i, content: line });
      }
    }
    for (; i < splittedPrevFile.length; i++) {
      changes.push({ line: i, content: null });
    }
    return changes;
  }
  async save({ repo, filesIterator }) {
    const commit = {
      prev: repo.head,
      changes: {},
    };
    for (const file of filesIterator) {
      const changes = await this.diff({ repo, file });
      if (changes.length) commit.changes[file.path] = changes;
    }
    if (!Object.keys(commit.changes).length) {
      console.error('No changes to commit');
      return;
    }
		store.save({
      ...repo,
      head: await store.save(commit),
		}, { id: repo.id })
  }
  async init() {
    return this.store.save({
      head: await this.store.save({
        prev: null,
        changes: [],
      }),
    });
  }
}

module.exports = MVCS;
