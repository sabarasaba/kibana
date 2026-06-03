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
  EuiBadge,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import type { ScriptOutput, CellStatus } from '../../types';

interface Props {
  status: CellStatus;
  output: ScriptOutput | null;
}


export function CellOutput({ status, output }: Props) {
  if (!output && status === 'idle') return null;

  const logs = output?.logs ?? [];
  const error = output?.error;
  const durationMs = output?.durationMs;

  return (
    <>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem grow={false}>
          {status === 'running' && <EuiBadge color="primary">Running…</EuiBadge>}
          {status === 'done' && <EuiBadge color="success">Done</EuiBadge>}
          {status === 'error' && <EuiBadge color="danger">Error</EuiBadge>}
        </EuiFlexItem>
        {durationMs !== undefined && (
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              {durationMs}ms
            </EuiText>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      {logs.length > 0 && (
        <>
          <EuiSpacer size="xs" />
          <EuiCodeBlock language="text" fontSize="s" paddingSize="s">
            {logs
              .map((l) => {
                const prefix = l.level !== 'log' ? `[${l.level.toUpperCase()}] ` : '';
                return prefix + l.text;
              })
              .join('\n')}
          </EuiCodeBlock>
        </>
      )}

      {error && (
        <>
          <EuiSpacer size="xs" />
          <EuiCodeBlock language="text" fontSize="s" paddingSize="s" color="dark">
            {`${error.message}${error.stack ? '\n\n' + error.stack : ''}`}
          </EuiCodeBlock>
        </>
      )}
    </>
  );
}
