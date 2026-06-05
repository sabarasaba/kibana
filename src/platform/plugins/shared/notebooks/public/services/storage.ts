/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Cell } from '../types';

const CELLS_KEY = 'notebooks:cells';
const NOTEBOOK_VERSION = 1;

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function loadCells(): Cell[] {
  try {
    const raw = window.localStorage.getItem(CELLS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Cell[];
  } catch {
    return [];
  }
}

export function saveCells(cells: Cell[]): void {
  try {
    window.localStorage.setItem(CELLS_KEY, JSON.stringify(cells));
  } catch {
    // Quota exceeded or private browsing
  }
}

export function exportNotebook(cells: Cell[]): void {
  const payload = JSON.stringify({ version: NOTEBOOK_VERSION, cells }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'notebook.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importNotebook(file: File): Promise<Cell[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse((e.target?.result as string) ?? '');
        if (!Array.isArray(data.cells) || data.cells.length === 0) {
          reject(new Error('Invalid notebook file: missing cells array'));
          return;
        }
        // Ensure every cell has a unique id
        const cells: Cell[] = data.cells.map((c: Partial<Cell>) => ({
          id: c.id ?? genId(),
          type: c.type === 'script' ? 'script' : 'request',
          value: typeof c.value === 'string' ? c.value : '',
        }));
        resolve(cells);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/** Generate a stable unique id for a new cell. */
export { genId };
