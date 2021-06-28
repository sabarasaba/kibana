/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook } from '@testing-library/react-hooks';
import produce from 'immer';
import React, { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { apmRouteConfig } from '../components/routing/apm_route_config';
import { ApmPluginContextValue } from '../context/apm_plugin/apm_plugin_context';
import {
  mockApmPluginContextValue,
  MockApmPluginContextWrapper,
} from '../context/apm_plugin/mock_apm_plugin_context';
import { useApmBreadcrumbs } from './use_apm_breadcrumbs';
import { useBreadcrumbs } from '../../../observability/public';

jest.mock('../../../observability/public');

function createWrapper(path: string) {
  return ({ children }: { children?: ReactNode }) => {
    const value = (produce(mockApmPluginContextValue, (draft) => {
      draft.core.application.navigateToUrl = (url: string) => Promise.resolve();
    }) as unknown) as ApmPluginContextValue;

    return (
      <MemoryRouter initialEntries={[path]}>
        <MockApmPluginContextWrapper value={value}>
          {children}
        </MockApmPluginContextWrapper>
      </MemoryRouter>
    );
  };
}

function mountBreadcrumb(path: string) {
  renderHook(() => useApmBreadcrumbs(apmRouteConfig), {
    wrapper: createWrapper(path),
  });
}

describe('useApmBreadcrumbs', () => {
  test('/services/:serviceName/errors/:groupId', () => {
    mountBreadcrumb(
      '/services/opbeans-node/errors/myGroupId?kuery=myKuery&rangeFrom=now-24h&rangeTo=now&refreshPaused=true&refreshInterval=0'
    );

    expect(useBreadcrumbs).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'APM',
          href:
            '/basepath/app/apm/?kuery=myKuery&rangeFrom=now-24h&rangeTo=now&refreshPaused=true&refreshInterval=0',
        }),
        expect.objectContaining({
          text: 'Services',
          href:
            '/basepath/app/apm/services?kuery=myKuery&rangeFrom=now-24h&rangeTo=now&refreshPaused=true&refreshInterval=0',
        }),
        expect.objectContaining({
          text: 'opbeans-node',
          href:
            '/basepath/app/apm/services/opbeans-node?kuery=myKuery&rangeFrom=now-24h&rangeTo=now&refreshPaused=true&refreshInterval=0',
        }),
        expect.objectContaining({
          text: 'Errors',
          href:
            '/basepath/app/apm/services/opbeans-node/errors?kuery=myKuery&rangeFrom=now-24h&rangeTo=now&refreshPaused=true&refreshInterval=0',
        }),
        expect.objectContaining({ text: 'myGroupId', href: undefined }),
      ])
    );
  });

  test('/services/:serviceName/errors', () => {
    mountBreadcrumb('/services/opbeans-node/errors?kuery=myKuery');

    expect(useBreadcrumbs).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'APM',
          href: '/basepath/app/apm/?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'Services',
          href: '/basepath/app/apm/services?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'opbeans-node',
          href: '/basepath/app/apm/services/opbeans-node?kuery=myKuery',
        }),
        expect.objectContaining({ text: 'Errors', href: undefined }),
      ])
    );
  });

  test('/services/:serviceName/transactions', () => {
    mountBreadcrumb('/services/opbeans-node/transactions?kuery=myKuery');

    expect(useBreadcrumbs).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'APM',
          href: '/basepath/app/apm/?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'Services',
          href: '/basepath/app/apm/services?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'opbeans-node',
          href: '/basepath/app/apm/services/opbeans-node?kuery=myKuery',
        }),
        expect.objectContaining({ text: 'Transactions', href: undefined }),
      ])
    );
  });

  test('/services/:serviceName/transactions/view?transactionName=my-transaction-name', () => {
    mountBreadcrumb(
      '/services/opbeans-node/transactions/view?kuery=myKuery&transactionName=my-transaction-name'
    );

    expect(useBreadcrumbs).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'APM',
          href: '/basepath/app/apm/?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'Services',
          href: '/basepath/app/apm/services?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'opbeans-node',
          href: '/basepath/app/apm/services/opbeans-node?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'Transactions',
          href:
            '/basepath/app/apm/services/opbeans-node/transactions?kuery=myKuery',
        }),
        expect.objectContaining({
          text: 'my-transaction-name',
          href: undefined,
        }),
      ])
    );
  });
});
