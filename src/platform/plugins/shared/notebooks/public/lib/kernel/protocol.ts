/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/** Main → Worker */
export interface RunMessage {
  type: 'run';
  cellId: string;
  code: string;
}

/** Worker → Main: pending ES request */
export interface EsCallMessage {
  type: 'es';
  id: number;
  method: string;
  path: string;
  body?: string;
}

/** Main → Worker: ES response */
export interface EsResultMessage {
  type: 'es-result';
  id: number;
  ok: boolean;
  statusCode: number;
  statusText: string;
  body: unknown;
}

/** Worker → Main: console output line */
export interface LogMessage {
  type: 'log';
  cellId: string;
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

/** Worker → Main: cell finished cleanly */
export interface DoneMessage {
  type: 'done';
  cellId: string;
  result?: unknown;
  durationMs: number;
}

/** Worker → Main: cell threw an error */
export interface ErrorMessage {
  type: 'error';
  cellId: string;
  message: string;
  stack?: string;
  durationMs: number;
}

export type WorkerOutMessage = EsCallMessage | LogMessage | DoneMessage | ErrorMessage;
export type MainToWorker = RunMessage | EsResultMessage;
