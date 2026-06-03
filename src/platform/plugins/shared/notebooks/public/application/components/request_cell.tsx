/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  EuiBadge,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPanel,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { CodeEditor } from '@kbn/code-editor/code_editor';
import { CONSOLE_LANG_ID, CONSOLE_THEME_ID, monaco } from '@kbn/monaco';
import type { HttpSetup } from '@kbn/core/public';
import type { DraggableProvidedDragHandleProps } from '@elastic/eui';
import { parseRequest } from '../../lib/parse_request';
import { sendRequest } from '../../lib/es';

interface CellOutput {
  statusCode: number;
  statusText: string;
  body: unknown;
  durationMs: number;
}

export interface RequestCellHandle {
  run: () => Promise<void>;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  http: HttpSetup;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}

export const RequestCell = forwardRef<RequestCellHandle, Props>(function RequestCell(
  { value, onChange, onRemove, http, dragHandleProps },
  ref
) {
  const [output, setOutput] = useState<CellOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [editorHeight, setEditorHeight] = useState(40);
  const [menuOpen, setMenuOpen] = useState(false);

  const onEditorMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    const update = () => setEditorHeight(Math.max(40, editor.getContentHeight()));
    update();
    editor.onDidContentSizeChange(update);
  }, []);

  const run = useCallback(async () => {
    const parsed = parseRequest(value);
    if (!parsed) return;
    setRunning(true);
    setOutput(null);
    setError(null);
    const start = Date.now();
    try {
      const result = await sendRequest(http, parsed.method, parsed.path, parsed.body);
      setOutput({ statusCode: result.statusCode, statusText: result.statusText, body: result.body, durationMs: Date.now() - start });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }, [http, value]);

  useImperativeHandle(ref, () => ({ run: () => run() }));

  const outputBody = output?.body !== undefined ? JSON.stringify(output.body, null, 2) : null;

  const menuButton = (
    <EuiButtonIcon
      iconType="boxesHorizontal"
      size="xs"
      color="text"
      onClick={() => setMenuOpen((o) => !o)}
      aria-label={i18n.translate('notebooks.requestCell.menu', { defaultMessage: 'Cell options' })}
    />
  );

  return (
    <EuiPanel paddingSize="s" hasBorder>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        {/* Left: drag + label */}
        {dragHandleProps && (
          <EuiFlexItem grow={false}>
            <div
              {...dragHandleProps}
              aria-label={i18n.translate('notebooks.requestCell.dragHandle', { defaultMessage: 'Drag to reorder' })}
              style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
            >
              <EuiIcon type="grab" color="subdued" size="s" />
            </div>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued"><strong>REQUEST</strong></EuiText>
        </EuiFlexItem>

        <EuiFlexItem />

        {/* Right: status · ... menu · play */}
        {running && (
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="s" />
          </EuiFlexItem>
        )}
        {output && !running && (
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiBadge color={output.statusCode < 400 ? 'success' : 'danger'}>
                  {output.statusCode}{output.statusText ? ` ${output.statusText}` : ''}
                </EuiBadge>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="xs" color="subdued">{output.durationMs}ms</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={menuButton}
            isOpen={menuOpen}
            closePopover={() => setMenuOpen(false)}
            panelPaddingSize="none"
            anchorPosition="downRight"
          >
            <EuiContextMenuPanel
              items={[
                <EuiContextMenuItem
                  key="delete"
                  icon="trash"
                  color="danger"
                  onClick={() => { setMenuOpen(false); onRemove(); }}
                >
                  {i18n.translate('notebooks.requestCell.deleteCell', { defaultMessage: 'Delete cell' })}
                </EuiContextMenuItem>,
              ]}
            />
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="play"
            size="xs"
            onClick={run}
            isDisabled={running}
            aria-label={i18n.translate('notebooks.requestCell.run', { defaultMessage: 'Run' })}
            display="fill"
            color="primary"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="xs" />

      <CodeEditor
        languageId={CONSOLE_LANG_ID}
        value={value}
        onChange={onChange}
        editorDidMount={onEditorMount}
        options={{
          theme: CONSOLE_THEME_ID,
          fontSize: 13,
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          scrollbar: { alwaysConsumeMouseWheel: false },
          occurrencesHighlight: 'off',
        }}
        height={editorHeight}
      />

      {outputBody && (
        <>
          <EuiSpacer size="xs" />
          <EuiCodeBlock language="json" fontSize="s" paddingSize="s" isCopyable>
            {outputBody}
          </EuiCodeBlock>
        </>
      )}

      {error && (
        <>
          <EuiSpacer size="xs" />
          <EuiCodeBlock language="text" fontSize="s" paddingSize="s" color="dark">
            {error}
          </EuiCodeBlock>
        </>
      )}
    </EuiPanel>
  );
});
