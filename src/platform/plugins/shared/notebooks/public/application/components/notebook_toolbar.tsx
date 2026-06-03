/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useRef } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

interface Props {
  isRunning: boolean;
  onRunAll: () => void;
  onCancel: () => void;
  onRestart: () => void;
  onAddRequest: () => void;
  onAddScript: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function NotebookToolbar({
  isRunning,
  onRunAll,
  onCancel,
  onRestart,
  onAddRequest,
  onAddScript,
  onExport,
  onImport,
}: Props) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
      <EuiFlexItem grow={false}>
        <EuiButton
          size="s"
          iconType="playFilled"
          onClick={onRunAll}
          isDisabled={isRunning}
          fill
        >
          {i18n.translate('notebooks.toolbar.runAll', { defaultMessage: 'Run all' })}
        </EuiButton>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiToolTip
          content={i18n.translate('notebooks.toolbar.cancelTooltip', {
            defaultMessage: 'Cancels execution and resets kernel state',
          })}
        >
          <EuiButton
            size="s"
            iconType="stop"
            onClick={onCancel}
            isDisabled={!isRunning}
            color="warning"
          >
            {i18n.translate('notebooks.toolbar.cancel', { defaultMessage: 'Cancel' })}
          </EuiButton>
        </EuiToolTip>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiToolTip
          content={i18n.translate('notebooks.toolbar.restartTooltip', {
            defaultMessage: 'Clears all kernel variables and restarts',
          })}
        >
          <EuiButtonEmpty
            size="s"
            iconType="refresh"
            onClick={onRestart}
            isDisabled={isRunning}
          >
            {i18n.translate('notebooks.toolbar.restart', { defaultMessage: 'Restart kernel' })}
          </EuiButtonEmpty>
        </EuiToolTip>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="s" iconType="plusInCircle" onClick={onAddRequest}>
          {i18n.translate('notebooks.toolbar.addRequest', { defaultMessage: '+ Request' })}
        </EuiButtonEmpty>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="s" iconType="editorCodeBlock" onClick={onAddScript}>
          {i18n.translate('notebooks.toolbar.addScript', { defaultMessage: '+ Script' })}
        </EuiButtonEmpty>
      </EuiFlexItem>

      <EuiFlexItem grow>
        {/* spacer */}
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="s" iconType="exportAction" onClick={onExport}>
          {i18n.translate('notebooks.toolbar.export', { defaultMessage: 'Export' })}
        </EuiButtonEmpty>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              // reset so same file can be re-imported
              e.target.value = '';
            }}
          />
          <EuiButtonEmpty
            size="s"
            iconType="importAction"
            onClick={() => importInputRef.current?.click()}
          >
            {i18n.translate('notebooks.toolbar.import', { defaultMessage: 'Import' })}
          </EuiButtonEmpty>
        </>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
