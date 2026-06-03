/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Rewrite line-leading const/let/var X = ... → self.X = ...
// so top-level bindings survive across cells in the shared Worker global scope.
// Destructuring patterns and function declarations are left unchanged (Phase 1 limitation).
const TOP_LEVEL_DECL_RE = /^(const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/gm;

export function transformForKernel(code: string): string {
  const transformed = code.replace(TOP_LEVEL_DECL_RE, (_match, _kw, name) => `self.${name} =`);
  return `(async function() {\n${transformed}\n})()`;
}
