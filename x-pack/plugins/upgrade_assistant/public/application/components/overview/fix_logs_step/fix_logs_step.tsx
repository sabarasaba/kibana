/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent } from 'react';

import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiText, EuiSpacer, EuiPanel, EuiLink, EuiCallOut } from '@elastic/eui';
import type { EuiStepProps } from '@elastic/eui/src/components/steps/step';

import { useAppContext } from '../../../app_context';
import { ExternalLinks } from './external_links';
import { DeprecationsCountCheckpoint } from './deprecations_count_checkpoint';
import { useDeprecationLogging } from './use_deprecation_logging';
import { DeprecationLoggingToggle } from './deprecation_logging_toggle';

const i18nTexts = {
  identifyStepTitle: i18n.translate('xpack.upgradeAssistant.overview.identifyStepTitle', {
    defaultMessage: 'Identify deprecated API use and update your applications',
  }),
  toggleTitle: i18n.translate('xpack.upgradeAssistant.overview.toggleTitle', {
    defaultMessage: 'Log Elasticsearch deprecation warnings',
  }),
  analyzeTitle: i18n.translate('xpack.upgradeAssistant.overview.analyzeTitle', {
    defaultMessage: 'Analyze deprecation logs',
  }),
  deprecationsCountCheckpointTitle: i18n.translate(
    'xpack.upgradeAssistant.overview.deprecationsCountCheckpointTitle',
    {
      defaultMessage: 'Resolve deprecation issues and verify your changes',
    }
  ),
  apiCompatibilityNoteTitle: i18n.translate(
    'xpack.upgradeAssistant.overview.apiCompatibilityNoteTitle',
    {
      defaultMessage: 'Apply API compatibility headers (optional)',
    }
  ),
  apiCompatibilityNoteBody: (docLink: string) => (
    <FormattedMessage
      id="xpack.upgradeAssistant.overview.apiCompatibilityNoteBody"
      defaultMessage="We recommend resolving deprecation issues before upgrading. However, if you need to enable an application to continue to function without making changes, you can include API compatibility headers in your requests. {learnMoreLink}."
      values={{
        learnMoreLink: (
          <EuiLink href={docLink} target="_blank">
            Learn more
          </EuiLink>
        ),
      }}
    />
  ),
  onlyLogWritingEnabledTitle: i18n.translate(
    'xpack.upgradeAssistant.overview.deprecationLogs.deprecationWarningTitle',
    {
      defaultMessage: 'Your logs are being written to the logs directory',
    }
  ),
  onlyLogWritingEnabledBody: i18n.translate(
    'xpack.upgradeAssistant.overview.deprecationLogs.deprecationWarningBody',
    {
      defaultMessage:
        'Go to your logs directory to view the deprecation logs or enable log collecting to see them in the UI.',
    }
  ),
};

const FixLogsStep: FunctionComponent = () => {
  const {
    services: {
      core: { docLinks },
    },
  } = useAppContext();
  const state = useDeprecationLogging();

  return (
    <>
      <EuiText>
        <h4>{i18nTexts.toggleTitle}</h4>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiPanel>
        <DeprecationLoggingToggle {...state} />
      </EuiPanel>

      {state.onlyDeprecationLogWritingEnabled && (
        <>
          <EuiSpacer size="m" />
          <EuiCallOut
            title={i18nTexts.onlyLogWritingEnabledTitle}
            color="warning"
            iconType="help"
            data-test-subj="deprecationWarningCallout"
          >
            <p>{i18nTexts.onlyLogWritingEnabledBody}</p>
          </EuiCallOut>
        </>
      )}

      {state.isDeprecationLogIndexingEnabled && (
        <>
          <EuiSpacer size="xl" />
          <EuiText data-test-subj="externalLinksTitle">
            <h4>{i18nTexts.analyzeTitle}</h4>
          </EuiText>
          <EuiSpacer size="m" />
          <ExternalLinks />

          <EuiSpacer size="xl" />
          <EuiText data-test-subj="deprecationsCountTitle">
            <h4>{i18nTexts.deprecationsCountCheckpointTitle}</h4>
          </EuiText>
          <EuiSpacer size="m" />
          <DeprecationsCountCheckpoint />

          <EuiSpacer size="xl" />
          <EuiText data-test-subj="apiCompatibilityNoteTitle">
            <h4>{i18nTexts.apiCompatibilityNoteTitle}</h4>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiText>
            <p>
              {i18nTexts.apiCompatibilityNoteBody(
                docLinks.links.elasticsearch.apiCompatibilityHeader
              )}
            </p>
          </EuiText>
        </>
      )}
    </>
  );
};

export const getFixLogsStep = (): EuiStepProps => {
  return {
    title: i18nTexts.identifyStepTitle,
    status: 'incomplete',
    children: <FixLogsStep />,
  };
};
