'use strict';
const DEFAULT_HOSTNAME = 'localhost';
const DEFAULT_PORT = '8001';
const DEFAULT_PROTOCOL = 'http';
const DEFAULT_FETCH = globalThis.fetch;

class MetaxAPI {
  constructor({
    hostname = DEFAULT_HOSTNAME,
    port = DEFAULT_PORT,
    protocol = DEFAULT_PROTOCOL,
    fetch = DEFAULT_FETCH,
  } = {}) {
    this.hostname = hostname;
    this.port = port;
    this.protocol = protocol;
    this.fetch = fetch;
  }

  request({ path, params = {} }, options = {}) {
    const { hostname, port, protocol } = this;
    const url = new URL(`${protocol}://${hostname}:${port}/${path}`);
    const searchParams = new URLSearchParams();
    for (const key in params) {
      searchParams.set(key, params[key]);
    }
    url.search = searchParams.toString();
    return this.fetch(url, options);
  }

  get(id) {
    return this.request({
      path: 'db/get',
      params: { id },
    }).then((resp) => resp.text());
  }

  save(body = '', { contentType = 'text/plain', ...params } = {}) {
    const requestOptions = {
      method: 'POST',
      body,
      headers: {
        'Metax-Content-Type': contentType,
      },
    };
    return this.request(
      {
        path: 'db/save/node',
        params,
      },
      requestOptions
    )
      .then((resp) => resp.json())
      .then((resp) => {
        if (resp.error) throw new Error(resp.error);
        return resp;
      });
  }
}

module.exports = MetaxAPI;
