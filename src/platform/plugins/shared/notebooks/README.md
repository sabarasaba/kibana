# Notebooks

A Dev Tools plugin that provides a notebook-style interface for interacting with Elasticsearch — the implementation of Console v2 (Phase 0 + Phase 1).

## Features

- **Request cells** — Console-syntax editor (`GET /index/_search`) hitting `POST /api/console/proxy`, inline JSON output.
- **Script cells** — JavaScript editor with injected `es` client (`await es.get(...)`, `await es.post(...)`). Variables declared at the top of a cell are shared across cells in the same kernel session.
- **Kernel** — user JS runs in a Web Worker (blob URL). Hard-cancel via `worker.terminate()`.
- **Run all** — executes script cells sequentially, top-to-bottom.
- **Drag to reorder** cells.
- **Export / Import** notebook as `.json`.
- **localStorage** autosave.

## Prerequisites

Script cell execution requires `unsafe-eval` in Kibana's CSP because user code runs via `eval` inside a
Web Worker. Add to `config/kibana.dev.yml` (or `kibana.yml` in production):

```yaml
csp.script_src: ["'unsafe-eval'"]
```

Without this, clicking **Run** on a script cell will silently fail with a CSP violation in the browser console.

> **Phase 1.2 plan:** replace the raw-eval worker with a QuickJS-WASM sandbox, which requires only
> the narrower `csp.script_src: ["'wasm-unsafe-eval'"]` and provides true isolation (user code cannot
> access `fetch` or the DOM).

## `es` client API

Inside script cells the following global is available:

```js
es.get(path)            // → Promise<body>
es.post(path, body)     // → Promise<body>
es.put(path, body)      // → Promise<body>
es.delete(path, body?)  // → Promise<body>
es.head(path)           // → Promise<boolean>  (rejects on 4xx/5xx)
```

All calls are proxied through `POST /api/console/proxy` — no new server surface, same auth/SSRF checks as Console.

## Cross-cell variable sharing

Top-level `const`/`let`/`var` declarations at the start of a line are automatically promoted to the
Worker's global scope so they're accessible from later cells:

```js
// Cell 1
const TARGET_INDEX = "logs-prod";   // → self.TARGET_INDEX

// Cell 2
const health = await es.get(`/${TARGET_INDEX}/_stats`);
console.log(health);
```

Destructuring patterns (`const { foo } = ...`) and indented declarations are cell-scoped only (Phase 1 limitation).
