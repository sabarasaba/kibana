/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export interface ParsedRequest {
  method: string;
  path: string;
  body?: string;
}

export function parseRequest(text: string): ParsedRequest | null {
  const lines = text.split('\n').map((l) => l.trim());
  const firstLine = lines.find((l) => l.length > 0 && !l.startsWith('#'));

  if (!firstLine) return null;

  const spaceIdx = firstLine.indexOf(' ');
  if (spaceIdx === -1) return null;

  const method = firstLine.slice(0, spaceIdx).toUpperCase();
  const path = firstLine.slice(spaceIdx + 1).trim();

  if (!path) return null;

  const bodyStart = lines.indexOf(firstLine) + 1;
  const bodyLines = lines.slice(bodyStart).join('\n').trim();
  const body = bodyLines.length > 0 ? bodyLines : undefined;

  return { method, path, body };
}
