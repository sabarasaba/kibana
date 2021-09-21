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
import { OverviewTestBed, setupOverviewPage } from '../overview.helpers';
import { setupEnvironment, advanceTime } from '../../helpers';
import {
  DEPRECATION_LOGS_INDEX,
  DEPRECATION_LOGS_SOURCE_ID,
  DEPRECATION_LOGS_COUNT_POLL_INTERVAL_MS,
} from '../../../../common/constants';

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

  describe('Step status', () => {
    test(`It's complete when there are no deprecation logs since last checkpoint`, async () => {
      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({ count: 0 });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, component } = testBed;

      component.update();

      expect(exists(`fixLogsStep-complete`)).toBe(true);
    });

    test(`It's incomplete when there are deprecation logs since last checkpoint`, async () => {
      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({ count: 5 });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, component } = testBed;

      component.update();

      expect(exists(`fixLogsStep-incomplete`)).toBe(true);
    });

    test(`It's incomplete when log collection is disabled `, async () => {
      httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({ count: 0 });

      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { actions, exists, component } = testBed;

      component.update();

      expect(exists(`fixLogsStep-complete`)).toBe(true);

      httpRequestsMockHelpers.setUpdateDeprecationLoggingResponse(getLoggingResponse(false));

      await actions.clickDeprecationToggle();

      expect(exists(`fixLogsStep-incomplete`)).toBe(true);
    });
  });

  describe('Step 1 - Toggle log writing and collecting', () => {
    test('toggles deprecation logging', async () => {
      const { find, actions } = testBed;

      httpRequestsMockHelpers.setUpdateDeprecationLoggingResponse(getLoggingResponse(false));

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
      expect(exists('apiCompatibilityNoteTitle')).toBe(false);
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
          plugins: {
            infra: {},
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

    test(`Doesn't show observability app link if infra app is not available`, async () => {
      const { component, exists } = testBed;

      component.update();

      expect(exists('viewObserveLogs')).toBe(false);
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

    describe('Poll for logs count', () => {
      beforeEach(async () => {
        jest.useFakeTimers();

        // First request should make the step be complete
        httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse({
          count: 0,
        });

        testBed = await setupOverviewPage();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      test('renders step as incomplete when a success state is followed by an error state', async () => {
        const { exists } = testBed;

        expect(exists('fixLogsStep-complete')).toBe(true);

        // second request will error
        const error = {
          statusCode: 500,
          error: 'Internal server error',
          message: 'Internal server error',
        };
        httpRequestsMockHelpers.setLoadDeprecationLogsCountResponse(undefined, error);

        // Resolve the polling timeout.
        await advanceTime(DEPRECATION_LOGS_COUNT_POLL_INTERVAL_MS);
        testBed.component.update();

        expect(exists('fixLogsStep-incomplete')).toBe(true);
      });
    });
  });

  describe('Step 4 - API compatibility header', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadDeprecationLoggingResponse(getLoggingResponse(true));
    });

    test('It shows copy with compatibility api header advice', async () => {
      await act(async () => {
        testBed = await setupOverviewPage();
      });

      const { exists, component } = testBed;

      component.update();

      expect(exists('apiCompatibilityNoteTitle')).toBe(true);
    });
  });

  describe('Privileges check', () => {
    test(`permissions warning callout is hidden if user has the right privileges`, async () => {
      const { exists } = testBed;

      // Index privileges warning callout should not be shown
      expect(exists('noIndexPermissionsCallout')).toBe(false);
      // Analyze logs and Resolve logs sections should be shown
      expect(exists('externalLinksTitle')).toBe(true);
      expect(exists('deprecationsCountTitle')).toBe(true);
    });

    test(`doesn't show analyze and resolve logs if it doesn't have the right privileges`, async () => {
      await act(async () => {
        testBed = await setupOverviewPage({
          privileges: {
            hasAllPrivileges: false,
            missingPrivileges: {
              index: [DEPRECATION_LOGS_INDEX],
            },
          },
        });
      });

      const { exists, component } = testBed;

      component.update();

      // No index privileges warning callout should be shown
      expect(exists('noIndexPermissionsCallout')).toBe(true);
      // Analyze logs and Resolve logs sections should be hidden
      expect(exists('externalLinksTitle')).toBe(false);
      expect(exists('deprecationsCountTitle')).toBe(false);
    });
  });
});
