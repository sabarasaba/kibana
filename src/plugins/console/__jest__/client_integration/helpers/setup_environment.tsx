/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { merge } from 'lodash';

import {
  ServicesContextProvider,
  EditorContextProvider,
  RequestContextProvider,
} from '../../../public/application/contexts';
import { getAppContextMock } from './app_context.mock';
import { ContextValue } from '../../../public/application/contexts/services_context';
import { init as initHttpRequests } from './http_requests';

jest.mock('../../../public/application/components/editor_example.tsx', () => ({
  EditorExample: () => '',
}));

export const WithAppDependencies =
  (Comp: any, { settings, ...overrides }: Record<string, unknown> = {}) =>
  (props: Record<string, unknown>) => {
    const appContextMock = getAppContextMock() as unknown as ContextValue;

    return (
      <ServicesContextProvider value={merge(appContextMock, overrides)}>
        <RequestContextProvider>
          <EditorContextProvider settings={appContextMock.services.settings.toJSON()}>
            <Comp {...props} />
          </EditorContextProvider>
        </RequestContextProvider>
      </ServicesContextProvider>
    );
  };

export const setupEnvironment = () => {
  const { server, httpRequestsMockHelpers } = initHttpRequests();

  return {
    server,
    httpRequestsMockHelpers,
  };
};
