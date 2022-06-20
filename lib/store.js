'use strict';
/* eslint-disable */
const UUIDRegexp =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
/* eslint-enable */
const isUUID = (text) => UUIDRegexp.test(text);

class Store {
  constructor(metaxAPI, { encrypted = false }) {
    this.metaxAPI = metaxAPI;
		this.encrypted = encrypted;
  }
  save(object, params = {}) {
    return this.metaxAPI
      .save(JSON.stringify(object), {
				enc: this.encrypted,
				...params
			})
      .then((resp) => resp.uuid);
  }
  get(uuid) {
    return this.metaxAPI.get(uuid).then(JSON.parse);
  }
  async load(uuid, { depth } = {}) {
    const object = await this.get(uuid);
    if (depth !== 0) {
      for (const key in object) {
        if (isUUID(object[key])) {
          object[key] = await this.load(object[key], { depth: depth - 1 });
        }
      }
    }
    return object;
  }
}

module.exports = Store;
