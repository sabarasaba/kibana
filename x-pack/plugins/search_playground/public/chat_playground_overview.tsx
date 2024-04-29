/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import React from 'react';
import { EuiPageTemplate } from '@elastic/eui';
import { PlaygroundProvider } from './providers/playground_provider';

import { App } from './components/app';
import { PlaygroundToolbar } from './embeddable';
import { PlaygroundHeaderDocs } from './components/playground_header_docs';

export const ChatPlaygroundOverview: React.FC = () => {
  return (
    <PlaygroundProvider
      defaultValues={{
        indices: [],
      }}
    >
      <EuiPageTemplate offset={0} grow restrictWidth data-test-subj="svlPlaygroundPage">
        <EuiPageTemplate.Header
          pageTitle={i18n.translate('xpack.searchPlayground.pageTitle', {
            defaultMessage: 'Playground',
          })}
          data-test-subj="svlPlaygroundPageTitle"
          restrictWidth
          rightSideItems={[<PlaygroundHeaderDocs />, <PlaygroundToolbar />]}
        />
        <App />
      </EuiPageTemplate>
    </PlaygroundProvider>
  );
};
