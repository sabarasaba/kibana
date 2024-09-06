/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, useEuiTheme } from '@elastic/eui';

import { Settings } from './settings';
import { Variables } from './variables';
import type { SenseEditor } from '../../models';

export interface Props {
  editorInstance: SenseEditor | null;
  containerWidth: number;
}

export function Config({ editorInstance, containerWidth }: Props) {
  const { euiTheme } = useEuiTheme();

  return (
    <EuiPanel
      color="subdued"
      paddingSize="l"
      hasShadow={false}
      borderRadius="none"
      css={{ height: '100%' }}
    >
      <EuiFlexGroup
        gutterSize="xl"
        direction={containerWidth < euiTheme.breakpoint.l ? 'column' : 'row'}
        // Turn off default responsiveness
        responsive={false}
      >
        <EuiFlexItem>
          <Settings editorInstance={editorInstance} />
        </EuiFlexItem>
        <EuiFlexItem>
          <Variables />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}
