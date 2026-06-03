/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import {
  EuiButton,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

interface Props {
  onAddRequest: () => void;
  onAddScript: () => void;
}

export function NotebookEmptyState({ onAddRequest, onAddScript }: Props) {
  return (
    <EuiEmptyPrompt
      iconType="editorCodeBlock"
      title={
        <h2>
          {i18n.translate('notebooks.emptyState.title', {
            defaultMessage: 'Start your notebook',
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('notebooks.emptyState.body', {
            defaultMessage:
              'Add a request cell to send Elasticsearch API calls, or a script cell to write JavaScript with the injected es client.',
          })}
        </p>
      }
      actions={
        <EuiFlexGroup gutterSize="m" justifyContent="center" wrap>
          <EuiFlexItem grow={false}>
            <EuiButton iconType="database" onClick={onAddRequest} fill>
              {i18n.translate('notebooks.emptyState.addRequest', {
                defaultMessage: 'Add request cell',
              })}
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton iconType="editorCodeBlock" onClick={onAddScript}>
              {i18n.translate('notebooks.emptyState.addScript', {
                defaultMessage: 'Add script cell',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
      color="plain"
    />
  );
}
