/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { DevToolsSetup } from '@kbn/dev-tools-plugin/public';
import type { ConsolePluginSetup, EsAutocompleteFacade } from '@kbn/console-plugin/public';

export type { EsAutocompleteFacade };

export interface NotebooksSetupDeps {
  devTools: DevToolsSetup;
  console?: ConsolePluginSetup;
}

export interface NotebooksPluginSetup {}
export interface NotebooksPluginStart {}

// ---- Notebook data model ----

export type CellType = 'request' | 'script';
export type CellStatus = 'idle' | 'running' | 'done' | 'error';

export interface Cell {
  id: string;
  type: CellType;
  value: string;
}

export interface LogLine {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

export interface ScriptOutput {
  logs: LogLine[];
  result?: unknown;
  error?: { message: string; stack?: string };
  durationMs?: number;
}
