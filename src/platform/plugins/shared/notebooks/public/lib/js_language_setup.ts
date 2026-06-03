/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { monaco } from '@kbn/monaco';

const ES_CLIENT_DEFS = `
declare const es: {
  /** Send a GET request. Resolves with the parsed response body. */
  get(path: string): Promise<any>;
  /** Send a POST request. Resolves with the parsed response body. */
  post(path: string, body?: object): Promise<any>;
  /** Send a PUT request. Resolves with the parsed response body. */
  put(path: string, body?: object): Promise<any>;
  /** Send a DELETE request. Resolves with the parsed response body. */
  delete(path: string, body?: object): Promise<any>;
  /** Send a HEAD request. Resolves true on 2xx, rejects on 4xx/5xx. */
  head(path: string): Promise<boolean>;
};
`;

let setupDone = false;

export function setupJsLanguage(): void {
  if (setupDone) return;
  setupDone = true;

  // monaco.languages.typescript is only available once @kbn/monaco has been rebuilt
  // with the TypeScript contribution (vs/language/typescript/monaco.contribution).
  // Guard here so the plugin doesn't crash on older builds.
  if (!monaco.languages.typescript) return;

  const js = monaco.languages.typescript.javascriptDefaults;

  js.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    lib: ['esnext'],
  });

  js.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    // Suppress top-level await errors — we wrap user code in an async IIFE
    diagnosticCodesToIgnore: [1375, 1378],
  });

  js.addExtraLib(ES_CLIENT_DEFS, 'notebooks://es-client.d.ts');
}
