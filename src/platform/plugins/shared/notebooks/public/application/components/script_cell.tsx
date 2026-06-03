/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { CodeEditor } from '@kbn/code-editor/code_editor';
import { monaco, CODE_EDITOR_DEFAULT_THEME_ID } from '@kbn/monaco';
import type { DraggableProvidedDragHandleProps } from '@elastic/eui';
import { buildJsSuggestionProvider } from '../../lib/es_suggestions';
import { setupJsLanguage } from '../../lib/js_language_setup';
import type { EsAutocompleteFacade } from '../../types';
import { CellOutput } from './cell_output';
import type { CellStatus, ScriptOutput } from '../../types';

const DEFAULT_VALUE = '// Script cell — JavaScript with injected `es` client\n';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: (value: string) => void;
  onRemove: () => void;
  status: CellStatus;
  output: ScriptOutput | null;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  esAutocompleteFacade?: EsAutocompleteFacade;
}

export function ScriptCell({
  value, onChange, onRun, onRemove, status, output, dragHandleProps, esAutocompleteFacade,
}: Props) {
  const isRunning = status === 'running';
  const [editorHeight, setEditorHeight] = useState(40);
  const [menuOpen, setMenuOpen] = useState(false);

  const suggestionProvider = useMemo(
    () => buildJsSuggestionProvider(esAutocompleteFacade),
    [esAutocompleteFacade]
  );

  const onEditorWillMount = useCallback(() => {
    setupJsLanguage();
  }, []);

  const onEditorMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    const update = () => setEditorHeight(Math.max(40, editor.getContentHeight()));
    update();
    editor.onDidContentSizeChange(update);
  }, []);

  const menuButton = (
    <EuiButtonIcon
      iconType="boxesHorizontal"
      size="xs"
      color="text"
      onClick={() => setMenuOpen((o) => !o)}
      aria-label={i18n.translate('notebooks.scriptCell.menu', { defaultMessage: 'Cell options' })}
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
              aria-label={i18n.translate('notebooks.scriptCell.dragHandle', { defaultMessage: 'Drag to reorder' })}
              style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
            >
              <EuiIcon type="grab" color="subdued" size="s" />
            </div>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued"><strong>SCRIPT</strong></EuiText>
        </EuiFlexItem>

        <EuiFlexItem />

        {/* Right: ... menu · play */}
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
                  {i18n.translate('notebooks.scriptCell.deleteCell', { defaultMessage: 'Delete cell' })}
                </EuiContextMenuItem>,
              ]}
            />
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="play"
            size="xs"
            onClick={() => onRun(value)}
            isDisabled={isRunning}
            isLoading={isRunning}
            aria-label={i18n.translate('notebooks.scriptCell.run', { defaultMessage: 'Run' })}
            display="fill"
            color="primary"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="xs" />

      <CodeEditor
        languageId="javascript"
        value={value || DEFAULT_VALUE}
        onChange={onChange}
        editorWillMount={onEditorWillMount}
        editorDidMount={onEditorMount}
        suggestionProvider={suggestionProvider}
        options={{
          theme: CODE_EDITOR_DEFAULT_THEME_ID,
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

      <CellOutput status={status} output={output} />
    </EuiPanel>
  );
}
