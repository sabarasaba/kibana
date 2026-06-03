/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// The worker body is shipped as a blob URL — no module imports allowed inside.
// Requires csp.script_src: ['unsafe-eval'] in kibana.yml.
// All es.* calls are proxied through the main thread → /api/console/proxy.
export const WORKER_SOURCE = `
(function() {
  var nextEsId = 0;
  var pendingEs = {};
  var currentCellId = null;
  var cellStartTime = 0;

  // --- injected es client ---
  function esCall(method, path, bodyObj) {
    return new Promise(function(resolve, reject) {
      var id = nextEsId++;
      pendingEs[id] = { resolve: resolve, reject: reject };
      var body = bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined;
      self.postMessage({ type: 'es', id: id, method: method, path: path, body: body });
    });
  }

  var es = {
    get:    function(path)       { return esCall('GET',    path).then(function(r) { return r.body; }); },
    post:   function(path, body) { return esCall('POST',   path, body).then(function(r) { return r.body; }); },
    put:    function(path, body) { return esCall('PUT',    path, body).then(function(r) { return r.body; }); },
    delete: function(path, body) { return esCall('DELETE', path, body).then(function(r) { return r.body; }); },
    head:   function(path)       { return esCall('HEAD',   path).then(function(r) { return r.statusCode < 400; }); },
  };
  self.es = es;

  // --- console capture ---
  var origLog   = console.log.bind(console);
  var origInfo  = console.info.bind(console);
  var origWarn  = console.warn.bind(console);
  var origError = console.error.bind(console);

  function makeConsoleFn(level, orig) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      var text = args.map(function(a) {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
      }).join(' ');
      self.postMessage({ type: 'log', cellId: currentCellId, level: level, text: text });
      orig.apply(console, args);
    };
  }

  console.log   = makeConsoleFn('log',   origLog);
  console.info  = makeConsoleFn('info',  origInfo);
  console.warn  = makeConsoleFn('warn',  origWarn);
  console.error = makeConsoleFn('error', origError);

  // --- message handler ---
  self.onmessage = async function(event) {
    var msg = event.data;

    if (msg.type === 'es-result') {
      var pending = pendingEs[msg.id];
      if (pending) {
        delete pendingEs[msg.id];
        if (msg.ok) {
          pending.resolve({ statusCode: msg.statusCode, statusText: msg.statusText, body: msg.body });
        } else {
          var err = new Error('ES ' + msg.statusCode + ' ' + msg.statusText);
          err.statusCode = msg.statusCode;
          err.body = msg.body;
          pending.reject(err);
        }
      }
      return;
    }

    if (msg.type === 'run') {
      currentCellId = msg.cellId;
      cellStartTime = Date.now();
      try {
        var result = await (0, eval)(msg.code);
        self.postMessage({ type: 'done', cellId: msg.cellId, result: result, durationMs: Date.now() - cellStartTime });
      } catch(err) {
        self.postMessage({
          type: 'error',
          cellId: msg.cellId,
          message: err && err.message ? err.message : String(err),
          stack: err && err.stack ? err.stack : undefined,
          durationMs: Date.now() - cellStartTime,
        });
      }
    }
  };
})();
`;
