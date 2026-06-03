/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { HttpSetup } from '@kbn/core/public';
import { sendRequest } from '../es';
import { WORKER_SOURCE } from './worker_source';
import { transformForKernel } from './transform';
import type { WorkerOutMessage } from './protocol';

export interface KernelEvents {
  onLog: (cellId: string, level: string, text: string) => void;
  onDone: (cellId: string, result: unknown, durationMs: number) => void;
  onError: (cellId: string, message: string, durationMs: number, stack?: string) => void;
}

interface PendingRun {
  cellId: string;
  resolve: () => void;
  reject: (err: Error) => void;
}

export class Kernel {
  private worker: Worker | null = null;
  private pending: PendingRun | null = null;

  constructor(private readonly http: HttpSetup, private readonly events: KernelEvents) {}

  start(): void {
    const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);
    URL.revokeObjectURL(url);
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = (e) => {
      if (this.pending) {
        const { cellId, reject } = this.pending;
        this.pending = null;
        this.events.onError(cellId, e.message ?? 'Worker error', 0);
        reject(new Error(e.message));
      }
    };
  }

  runCell(cellId: string, rawCode: string): Promise<void> {
    if (!this.worker) this.start();
    return new Promise<void>((resolve, reject) => {
      this.pending = { cellId, resolve, reject };
      const code = transformForKernel(rawCode);
      this.worker!.postMessage({ type: 'run', cellId, code });
    });
  }

  /** Hard-cancel current execution and restart the kernel (clears all state). */
  cancel(): void {
    this.terminate();
    this.start();
  }

  /** Alias for cancel — terminates and restarts, clearing all kernel scope. */
  restart(): void {
    this.terminate();
    this.start();
  }

  terminate(): void {
    if (this.pending) {
      const { reject } = this.pending;
      this.pending = null;
      reject(new Error('Cancelled'));
    }
    this.worker?.terminate();
    this.worker = null;
  }

  private handleMessage(event: MessageEvent<WorkerOutMessage>): void {
    const msg = event.data;

    if (msg.type === 'es') {
      sendRequest(this.http, msg.method, msg.path, msg.body).then((result) => {
        const ok = result.statusCode < 400;
        this.worker?.postMessage({
          type: 'es-result',
          id: msg.id,
          ok,
          statusCode: result.statusCode,
          statusText: result.statusText,
          body: result.body,
        });
      });
      return;
    }

    if (msg.type === 'log') {
      this.events.onLog(msg.cellId, msg.level, msg.text);
      return;
    }

    if (msg.type === 'done') {
      const pending = this.pending;
      this.pending = null;
      this.events.onDone(msg.cellId, msg.result, msg.durationMs);
      pending?.resolve();
      return;
    }

    if (msg.type === 'error') {
      const pending = this.pending;
      this.pending = null;
      this.events.onError(msg.cellId, msg.message, msg.durationMs, msg.stack);
      pending?.reject(new Error(msg.message));
    }
  }
}
