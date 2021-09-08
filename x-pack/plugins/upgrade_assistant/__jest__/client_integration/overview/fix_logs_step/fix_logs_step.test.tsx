/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { act } from 'react-dom/test-utils';

// Once the logs team register the kibana locators in their app, we should be able
// to remove this mock and follow a similar approach to how discover link is tested.
// See: https://github.com/elastic/kibana/issues/104855
const MOCKED_TIME = '2021-09-05T10:49:01.805Z';
jest.mock('../../../../public/application/lib/logs_checkpoint', () => {
  const originalModule = jest.requireActual('../../../../public/application/lib/logs_checkpoint');

  return {
    __esModule: true,
    ...originalModule,
    loadLogsCheckpoint: jest.fn().mockReturnValue('2021-09-05T10:49:01.805Z'),
  };
});

import { DeprecationLoggingStatus } from '../../../../common/types';
import { DEPRECATION_LOGS_SOURCE_ID } from '../../../../common/constants';
import { setupEnvironment } from '../../helpers';
import { OverviewTestBed, setupOverviewPage } from '../overview.helpers';

const getLoggingResponse = (toggle: boolean): DeprecationLoggingStatus => ({
  isDeprecationLogIndexingEnabled: toggle,
  isDeprecationLoggingEnabled: toggle,
});

describe('Overview - Fix deprecation logs step', () => {
  let testBed: OverviewTestBed;
  const { server, httpRequestsMockHelpers } = setupEnvironment();

  beforeEach(async () => {
    httpRequestsMockHelpers.setLoadDeprecationLoggingResponse(getLoggingResponse(true));
    testBed = await setupOverviewPage();

    const { component } = testBed;
    component.update();
  });

  afterAll(() => {
    server.restore();
  });

  describe('Step 1 - Toggle log writing and collecting', () => {
    test('toggles deprecation logging', async () => {
      const { find, actions } = testBed;

      httpRequestsMockHelpers.setUpdateDeprecationLoggingResponse({
        isDeprecationLogIndexingEnabled: false,
        isDeprecationLoggingEnabled: false,
      });

      expect(find('deprecationLoggingToggle').props()['aria-checked']).toBe(true);

      await actions.clickDeprecationToggle();

      const latestRequest = server.requests[server.requests.length - 1];
      expect(JSON.parse(JSON.parse(latestRequest.requestBody).body)).toEqual({ isEnabled: false });
      expect(find('deprecationLoggingToggle').props()['aria-checked']).toBe(false);
    });

    test('shows callout when only loggerDeprecation is enabled', async () => {
      httpRequestsMockHelpers.setLoadDeprecationLoggingResponse({
        isDeprecationLogIndexingEnabled: false,
        isDeprecationLoggingEnabled: true,
      });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, component } = testBed;

      component.update();

      expect(exists('deprecationWarningCallout')).toBe(true);
    });

    test('handles network error when updating logging state', async () => {
      const error = {
        statusCode: 500,
        error: 'Internal server error',
        message: 'Internal server error',
      };

      const { actions, exists } = testBed;

      httpRequestsMockHelpers.setUpdateDeprecationLoggingResponse(undefined, error);

      await actions.clickDeprecationToggle();

      expect(exists('updateLoggingError')).toBe(true);
    });

    test('handles network error when fetching logging state', async () => {
      const error = {
        statusCode: 500,
        error: 'Internal server error',
        message: 'Internal server error',
      };

      httpRequestsMockHelpers.setLoadDeprecationLoggingResponse(undefined, error);

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { component, exists } = testBed;

      component.update();

      expect(exists('fetchLoggingError')).toBe(true);
    });

    test('It doesnt show external links and deprecations count when toggle is disabled', async () => {
      httpRequestsMockHelpers.setLoadDeprecationLoggingResponse({
        isDeprecationLogIndexingEnabled: false,
        isDeprecationLoggingEnabled: false,
      });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, component } = testBed;

      component.update();

      expect(exists('externalLinksTitle')).toBe(false);
      expect(exists('deprecationsCountTitle')).toBe(false);
    });
  });

  describe('Step 2 - Analyze logs', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadDeprecationLoggingResponse(getLoggingResponse(true));
    });

    test('Has a link to see logs in observability app', async () => {
      await act(async () => {
        testBed = await setupOverviewPage({
          http: {
            basePath: {
              prepend: (url: string) => url,
            },
          },
        });
      });

      const { component, exists, find } = testBed;

      component.update();

      expect(exists('viewObserveLogs')).toBe(true);
      expect(find('viewObserveLogs').props().href).toBe(
        `/app/logs/stream?sourceId=${DEPRECATION_LOGS_SOURCE_ID}&logPosition=(end:now,start:'${MOCKED_TIME}')`
      );
    });

    test('Has a link to see logs in discover app', async () => {
      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, component, find } = testBed;

      component.update();

      expect(exists('viewDiscoverLogs')).toBe(true);

      const decodedUrl = decodeURIComponent(find('viewDiscoverLogs').props().href);
      expect(decodedUrl).toContain('discoverUrl');
      ['"language":"kuery"', '"query":"@timestamp+>'].forEach((param) => {
        expect(decodedUrl).toContain(param);
      });
    });
  });

  describe('Step 3 - Resolve log issues', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadDeprecationLoggingResponse(getLoggingResponse(true));
    });

    test('With deprecation warnings', async () => {
      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({
        count: 10,
      });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { find, exists, component } = testBed;

      component.update();

      expect(exists('hasWarningsCallout')).toBe(true);
      expect(find('hasWarningsCallout').text()).toContain('10');
    });

    test('No deprecation warnings', async () => {
      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({
        count: 0,
      });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { find, exists, component } = testBed;

      component.update();

      expect(exists('noWarningsCallout')).toBe(true);
      expect(find('noWarningsCallout').text()).toContain('No deprecation warnings');
    });

    test('Handles errors and can retry', async () => {
      const error = {
        statusCode: 500,
        error: 'Internal server error',
        message: 'Internal server error',
      };

      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse(undefined, error);

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, actions, component } = testBed;

      component.update();

      expect(exists('errorCallout')).toBe(true);

      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({
        count: 0,
      });

      await actions.clickRetryButton();

      expect(exists('noWarningsCallout')).toBe(true);
    });

    test('Allows user to reset last stored date', async () => {
      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({
        count: 10,
      });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, actions, component } = testBed;

      component.update();

      expect(exists('hasWarningsCallout')).toBe(true);
      expect(exists('resetLastStoredDate')).toBe(true);

      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({
        count: 0,
      });

      await actions.clickResetButton();

      expect(exists('noWarningsCallout')).toBe(true);
    });
  });
});
