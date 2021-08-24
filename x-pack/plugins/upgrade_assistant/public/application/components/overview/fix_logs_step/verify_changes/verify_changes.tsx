/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent, useState } from 'react';
import moment from 'moment-timezone';
import useInterval from 'react-use/lib/useInterval';
import { FormattedDate, FormattedTime, FormattedMessage } from '@kbn/i18n/react';

import { i18n } from '@kbn/i18n';
import { EuiCallOut, EuiButton, EuiLoadingContent, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useAppContext } from '../../../../app_context';
import { Storage } from '../../../../../shared_imports';

const POLLING_INTERVAL = 60000;
const LOCALSTORAGE_KEY = 'kibana.upgradeAssistant.lastPollingCheck';
const localStorage = new Storage(window.localStorage);

const i18nTexts = {
  calloutTitle: (warningsCount: number, previousCheck: string) => (
    <FormattedMessage
      id="xpack.upgradeAssistant.overview.verifyChanges.calloutTitle"
      defaultMessage="{warningsCount, plural, =0 {No} other {{warningsCount}}} deprecation {warningsCount, plural, one {warning} other {warnings}} since {previousCheck}"
      values={{
        warningsCount,
        previousCheck: (
          <>
            <FormattedDate value={previousCheck} year="numeric" month="long" day="2-digit" />{' '}
            <FormattedTime value={previousCheck} timeZoneName="short" hour12={false} />
          </>
        ),
      }}
    />
  ),
  calloutBody: i18n.translate('xpack.upgradeAssistant.overview.verifyChanges.calloutBody', {
    defaultMessage:
      'Reset the counter after making changes and continue monitoring to verify that you are no longer using deprecated APIs.',
  }),
  loadingError: i18n.translate('xpack.upgradeAssistant.overview.verifyChanges.loadingError', {
    defaultMessage: 'An error occurred while retrieving the count of deprecation logs',
  }),
  retryButton: i18n.translate('xpack.upgradeAssistant.overview.verifyChanges.retryButton', {
    defaultMessage: 'Try again',
  }),
  resetCounterButton: i18n.translate(
    'xpack.upgradeAssistant.overview.verifyChanges.resetCounterButton',
    {
      defaultMessage: 'Reset counter',
    }
  ),
};

const getPreviousCheck = () => {
  const storedValue = moment(localStorage.get(LOCALSTORAGE_KEY));

  if (storedValue.isValid()) {
    return storedValue.toISOString();
  }

  const now = moment().toISOString();
  localStorage.set(LOCALSTORAGE_KEY, now);

  return now;
};

export const VerifyChanges: FunctionComponent = () => {
  const { api } = useAppContext();
  const [previousCheck, setPreviousCheck] = useState(getPreviousCheck());
  const { data, error, isLoading, resendRequest } = api.getDeprecationLogsCount(previousCheck);

  const warningsCount = data?.count || 0;
  const calloutTint = warningsCount > 0 ? 'warning' : 'success';
  const calloutIcon = warningsCount > 0 ? 'alert' : 'check';
  const calloutTestId = warningsCount > 0 ? 'hasWarningsCallout' : 'noWarningsCallout';

  useInterval(() => {
    resendRequest();
  }, POLLING_INTERVAL);

  const onResetClick = () => {
    const now = moment().toISOString();

    setPreviousCheck(now);
    localStorage.set(LOCALSTORAGE_KEY, now);
  };

  if (isLoading) {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiLoadingContent lines={6} />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (error) {
    return (
      <EuiCallOut
        title={i18nTexts.loadingError}
        color="danger"
        iconType="alert"
        data-test-subj="errorCallout"
      >
        <p>
          {error.statusCode} - {error.message}
        </p>
        <EuiButton color="danger" onClick={resendRequest} data-test-subj="errorResetButton">
          {i18nTexts.retryButton}
        </EuiButton>
      </EuiCallOut>
    );
  }

  return (
    <EuiCallOut
      title={i18nTexts.calloutTitle(warningsCount, previousCheck)}
      color={calloutTint}
      iconType={calloutIcon}
      data-test-subj={calloutTestId}
    >
      <p>{i18nTexts.calloutBody}</p>
      <EuiButton color={calloutTint} onClick={onResetClick} data-test-subj="resetLastStoredDate">
        {i18nTexts.resetCounterButton}
      </EuiButton>
    </EuiCallOut>
  );
};
