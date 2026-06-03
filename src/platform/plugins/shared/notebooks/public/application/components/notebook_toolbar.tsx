/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
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
}

export function NotebookToolbar({
  isRunning,
  onRunAll,
  onCancel,
  onRestart,
  onAddRequest,
  onAddScript,
}: Props) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const addButton = (
    <EuiButton
      size="s"
      iconType="plusInCircle"
      iconSide="left"
      onClick={() => setAddMenuOpen((o) => !o)}
    >
      {i18n.translate('notebooks.toolbar.add', { defaultMessage: 'Add' })}
    </EuiButton>
  );

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
      {/* Run all / Cancel — merged toggle */}
      <EuiFlexItem grow={false}>
        {isRunning ? (
          <EuiButton size="s" iconType="stop" onClick={onCancel} color="warning" fill>
            {i18n.translate('notebooks.toolbar.cancel', { defaultMessage: 'Cancel' })}
          </EuiButton>
        ) : (
          <EuiButton size="s" iconType="playFilled" onClick={onRunAll} fill>
            {i18n.translate('notebooks.toolbar.runAll', { defaultMessage: 'Run all' })}
          </EuiButton>
        )}
      </EuiFlexItem>

      {/* Restart */}
      <EuiFlexItem grow={false}>
        <EuiToolTip
          content={i18n.translate('notebooks.toolbar.restartTooltip', {
            defaultMessage: 'Clears all outputs and kernel variables',
          })}
        >
          <EuiButtonEmpty size="s" iconType="refresh" onClick={onRestart} isDisabled={isRunning}>
            {i18n.translate('notebooks.toolbar.restart', { defaultMessage: 'Restart' })}
          </EuiButtonEmpty>
        </EuiToolTip>
      </EuiFlexItem>

      <EuiFlexItem />

      {/* Add cell dropdown — far right */}
      <EuiFlexItem grow={false}>
        <EuiPopover
          button={addButton}
          isOpen={addMenuOpen}
          closePopover={() => setAddMenuOpen(false)}
          panelPaddingSize="none"
          anchorPosition="downRight"
        >
          <EuiContextMenuPanel
            items={[
              <EuiContextMenuItem
                key="request"
                icon="database"
                onClick={() => { setAddMenuOpen(false); onAddRequest(); }}
              >
                {i18n.translate('notebooks.toolbar.addRequest', { defaultMessage: 'Request cell' })}
              </EuiContextMenuItem>,
              <EuiContextMenuItem
                key="script"
                icon="editorCodeBlock"
                onClick={() => { setAddMenuOpen(false); onAddScript(); }}
              >
                {i18n.translate('notebooks.toolbar.addScript', { defaultMessage: 'Script cell' })}
              </EuiContextMenuItem>,
            ]}
          />
        </EuiPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
