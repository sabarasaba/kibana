/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiTitle, EuiFlexGroup, EuiFlexItem, EuiLink, EuiEmptyPrompt } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { useServicesContext } from '../../contexts';

export function HistoryEmptyPrompt() {
  const { docLinks } = useServicesContext();

  return (
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiEmptyPrompt
          title={
            <h2>
              {i18n.translate('console.historyPage.emptyPromptTitle', {
                defaultMessage: 'No queries yet',
              })}
            </h2>
          }
          titleSize="xs"
          body={
            <p>
              {i18n.translate('console.historyPage.emptyPromptBody', {
                defaultMessage:
                  'This history panel will display any past queries you’ve run for review and reuse.',
              })}
            </p>
          }
          footer={
            <EuiTitle size="xxs">
              <div>
                <h3>
                  <FormattedMessage
                    id="console.historyPage.emptyPromptFooterLabel"
                    defaultMessage="Want to learn more?"
                  />
                </h3>
                <EuiLink href={docLinks.console.guide} target="_blank">
                  <FormattedMessage
                    id="console.historyPage.emptyPromptFooterLink"
                    defaultMessage="Read Console documentation"
                  />
                </EuiLink>
              </div>
            </EuiTitle>
          }
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
