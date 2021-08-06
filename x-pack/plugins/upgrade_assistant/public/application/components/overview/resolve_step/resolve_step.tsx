/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { EuiText, EuiFlexItem, EuiFlexGroup, EuiSpacer } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import type { EuiStepProps } from '@elastic/eui/src/components/steps/step';
import { ESDeprecationStats } from './es_stats';
import { KibanaDeprecationStats } from './kibana_stats';

const i18nTexts = {
  resolveStepTitle: i18n.translate('xpack.upgradeAssistant.overview.resolveStepTitle', {
    defaultMessage: 'Resolve deprecation issues in Elasticsearch and Kibana',
  }),
};

export const getResolveStep = (): EuiStepProps => {
  return {
    title: i18nTexts.resolveStepTitle,
    status: 'incomplete',
    children: (
      <>
        <EuiText>
          <p>
            <FormattedMessage
              id="xpack.upgradeAssistant.overview.resolveStepDescription"
              defaultMessage="Review your deprecation issues. Use the provided {quickResolve} actions to update configuration automatically. Follow instructions for any issues in need of manual configuration."
              values={{ quickResolve: <b>Quick Resolve</b> }}
            />
          </p>
        </EuiText>

        <EuiSpacer size="m" />

        <EuiFlexGroup>
          <EuiFlexItem>
            <ESDeprecationStats />
          </EuiFlexItem>

          <EuiFlexItem>
            <KibanaDeprecationStats />
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    ),
  };
};
