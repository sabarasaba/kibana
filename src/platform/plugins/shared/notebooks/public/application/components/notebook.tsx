/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiSpacer,
  EuiTitle,
  euiDragDropReorder,
} from '@elastic/eui';
import type { DropResult } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { HttpSetup } from '@kbn/core/public';
import { Kernel } from '../../lib/kernel';
import type { Cell, CellStatus, ScriptOutput } from '../../types';
import {
  loadCells,
  saveCells,
  exportNotebook,
  importNotebook,
  genId,
} from '../../services/storage';
import { NotebookToolbar } from './notebook_toolbar';
import { RequestCell } from './request_cell';
import type { RequestCellHandle } from './request_cell';
import { ScriptCell } from './script_cell';

interface Props {
  http: HttpSetup;
}

export function Notebook({ http }: Props) {
  const [cells, setCells] = useState<Cell[]>(() => loadCells());
  const [cellStatuses, setCellStatuses] = useState<Record<string, CellStatus>>({});
  const [scriptOutputs, setScriptOutputs] = useState<Record<string, ScriptOutput>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const cancelRunAllRef = useRef(false);
  const kernelRef = useRef<Kernel | null>(null);
  const requestCellRefs = useRef<Record<string, RequestCellHandle | null>>({});

  // Initialise kernel once on mount, terminate on unmount
  useEffect(() => {
    const kernel = new Kernel(http, {
      onLog: (cellId, level, text) => {
        setScriptOutputs((prev) => ({
          ...prev,
          [cellId]: {
            ...prev[cellId],
            logs: [...(prev[cellId]?.logs ?? []), { level: level as ScriptOutput['logs'][number]['level'], text }],
          },
        }));
      },
      onDone: (cellId, _result, durationMs) => {
        setCellStatuses((prev) => ({ ...prev, [cellId]: 'done' }));
        setScriptOutputs((prev) => ({
          ...prev,
          [cellId]: { ...(prev[cellId] ?? { logs: [] }), durationMs },
        }));
      },
      onError: (cellId, message, durationMs, stack) => {
        setCellStatuses((prev) => ({ ...prev, [cellId]: 'error' }));
        setScriptOutputs((prev) => ({
          ...prev,
          [cellId]: {
            ...(prev[cellId] ?? { logs: [] }),
            error: { message, stack },
            durationMs,
          },
        }));
      },
    });
    kernel.start();
    kernelRef.current = kernel;
    return () => kernel.terminate();
  }, [http]);

  const updateCell = useCallback((id: string, value: string) => {
    setCells((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, value } : c));
      saveCells(updated);
      return updated;
    });
  }, []);

  const removeCell = useCallback((id: string) => {
    delete requestCellRefs.current[id];
    setCells((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      const result = updated.length > 0 ? updated : [{ id: genId(), type: 'request' as const, value: 'GET /_cluster/health' }];
      saveCells(result);
      return result;
    });
  }, []);

  const addCell = useCallback((type: Cell['type']) => {
    const newCell: Cell = { id: genId(), type, value: '' };
    setCells((prev) => {
      const updated = [...prev, newCell];
      saveCells(updated);
      return updated;
    });
  }, []);

  const onDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      if (!source || !destination) return;
      setCells((prev) => {
        const reordered = euiDragDropReorder(prev, source.index, destination.index);
        saveCells(reordered);
        return reordered;
      });
    },
    []
  );

  const runScriptCell = useCallback(
    async (cellId: string, code: string) => {
      if (!kernelRef.current) return;
      setCellStatuses((prev) => ({ ...prev, [cellId]: 'running' }));
      setScriptOutputs((prev) => ({ ...prev, [cellId]: { logs: [] } }));
      try {
        await kernelRef.current.runCell(cellId, code);
      } catch {
        // status already set by kernel error callback
      }
    },
    []
  );

  const handleRunAll = useCallback(async () => {
    if (!kernelRef.current) return;
    setIsRunningAll(true);
    cancelRunAllRef.current = false;

    // snapshot cells so we iterate a consistent list
    const snapshot = cells;
    for (const cell of snapshot) {
      if (cancelRunAllRef.current) break;
      if (cell.type === 'script') {
        await runScriptCell(cell.id, cell.value).catch(() => {});
      } else {
        await requestCellRefs.current[cell.id]?.run().catch(() => {});
      }
    }
    setIsRunningAll(false);
  }, [cells, runScriptCell]);

  const handleCancel = useCallback(() => {
    cancelRunAllRef.current = true;
    setIsRunningAll(false);
    kernelRef.current?.cancel();
    setCellStatuses((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id] === 'running') next[id] = 'idle';
      });
      return next;
    });
  }, []);

  const handleRestart = useCallback(() => {
    kernelRef.current?.restart();
    setCellStatuses({});
    setScriptOutputs({});
  }, []);

  const handleExport = useCallback(() => exportNotebook(cells), [cells]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importNotebook(file);
      setCells(imported);
      saveCells(imported);
      setCellStatuses({});
      setScriptOutputs({});
    } catch (err) {
      // TODO: surface as EuiToast in a later pass
      console.error('Import failed:', err);
    }
  }, []);

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <NotebookToolbar
        isRunning={isRunningAll}
        onRunAll={handleRunAll}
        onCancel={handleCancel}
        onRestart={handleRestart}
        onAddRequest={() => addCell('request')}
        onAddScript={() => addCell('script')}
        onExport={handleExport}
        onImport={handleImport}
      />

      <EuiSpacer size="l" />

      <EuiDragDropContext onDragEnd={onDragEnd}>
        <EuiDroppable droppableId="notebookCells" spacing="m">
          {cells.map((cell, index) => (
            <EuiDraggable
              key={cell.id}
              draggableId={cell.id}
              index={index}
              customDragHandle
              hasInteractiveChildren
              spacing="m"
            >
              {(provided) =>
                cell.type === 'request' ? (
                  <RequestCell
                    ref={(el) => { requestCellRefs.current[cell.id] = el; }}
                    value={cell.value}
                    onChange={(v) => updateCell(cell.id, v)}
                    onRemove={() => removeCell(cell.id)}
                    http={http}
                    dragHandleProps={provided.dragHandleProps}
                  />
                ) : (
                  <ScriptCell
                    value={cell.value}
                    onChange={(v) => updateCell(cell.id, v)}
                    onRun={(v) => runScriptCell(cell.id, v)}
                    onRemove={() => removeCell(cell.id)}
                    status={cellStatuses[cell.id] ?? 'idle'}
                    output={scriptOutputs[cell.id] ?? null}
                    dragHandleProps={provided.dragHandleProps}
                  />
                )
              }
            </EuiDraggable>
          ))}
        </EuiDroppable>
      </EuiDragDropContext>
    </div>
  );
}
