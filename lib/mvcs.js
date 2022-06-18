'use strict';
class MVCS {
	constructor({ store }) {
		this.store = store;
	}
	async getFileSplitted({ head, filePath }) {
		const lines = [];
		const queue = [head];
		while (queue.length) {
			const commitId = queue.shift();
			const commit = await this.store.get(commitId);
			const changes = commit.changes[filePath];
			if (changes) {
				for (const lineNumber in changes) {
					if (!lines[lineNumber]) {
						lines[lineNumber] = changes[lineNumber];
					}
				}
			}
			if (commit.prev) {
				queue.push(commit.prev);
			}
		}
		return lines;
	}
	

	// :TODO Use caching mechanism for store 
	// :TODO Use shasum for diffing
	async diff({ head, file }) {
		const splittedNewFile = file.content.split(/\r?\n/);
		const splittedFile = await this.getFileSplitted({
			head,
			filePath: file.path,
		});
		const changes = {};
		for (var i = 0; i < splittedNewFile.length; i++) {
			const line = splittedNewFile[i];
			if (line !== splittedFile[i]) {
				changes[i] = line;
			}
		}
		for (; i < splittedFile.length; i++) {
			changes[i] = null; 
		}
		return changes;
	}

	async *repoAllFilesIterator(headId) {
		const trackedFilesPaths = [];
		for(
			let commitId = headId; 
			commitId; 
			commitId = commit.prev
		) {
			var commit = await this.store.get(commitId);
			const { changes } = commit;
			for(const filePath in changes) {
				if(!trackedFilesPaths.includes(filePath)) {
					trackedFilesPaths.push(filePath);
					if(changes[filePath] !== null)
						yield filePath;
				}
			}
		}
	}

	async *checkout(commitId) {
		for await (const filePath of this.repoAllFilesIterator(commitId)) {
			const content = await this.getFileSplitted({ head: commitId, filePath });
			yield { 
				path: filePath, 
				content: content.join('\n') 
			}
		}
	}

	async save({ repoId, filesIterator }) {
		const repo = await this.store.get(repoId);
		if (repo.error) {
			throw new Error(repo.error);
		}
		const commit = {
			prev: repo.head,
			changes: {},
		};
		const processed = new Set();
		for await (const file of filesIterator) {
			const changes = await this.diff({ head: repo.head, file });
			if (Object.keys(changes).length) {
			  // :TODO Use DI 
				console.log("SAVE", file.path);
				commit.changes[file.path] = changes
			};
			processed.add(file.path);
		}
		for await (const filePath of this.repoAllFilesIterator(repo.head)) {
			if(!processed.has(filePath)) {
			  // :TODO Use DI 
				console.log("RM", filePath);
				commit.changes[filePath] = null;
			}
		}
		if (!Object.keys(commit.changes).length) {
			return;
		}
		const commitId = await this.store.save(commit);
		await this.store.save(
			{
				...repo,
				head: commitId,
			},
			{ id: repoId }
		);
		return commitId; 
	}
	async create() {
		const commit = await this.store.save({
			prev: null,
			changes: [],
		})
		return this.store.save({
			head: commit,
		});
	}
}

module.exports = MVCS;
