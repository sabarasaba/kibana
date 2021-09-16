/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent, useState, useEffect } from 'react';

import { i18n } from '@kbn/i18n';
import { EuiText, EuiSpacer, EuiPanel, EuiCallOut } from '@elastic/eui';
import type { EuiStepProps } from '@elastic/eui/src/components/steps/step';

import { ExternalLinks } from './external_links';
import { DEPRECATION_LOGS_INDEX } from '../../../../../common/constants';
import { DeprecationsCountCheckpoint } from './deprecations_count_checkpoint';
import { useDeprecationLogging } from './use_deprecation_logging';
import { DeprecationLoggingToggle } from './deprecation_logging_toggle';
import { loadLogsCheckpoint, saveLogsCheckpoint } from '../../../lib/logs_checkpoint';
import type { OverviewStepProps } from '../../types';
import { WithPrivileges, MissingPrivileges } from '../../../../shared_imports';

const i18nTexts = {
  identifyStepTitle: i18n.translate('xpack.upgradeAssistant.overview.identifyStepTitle', {
    defaultMessage: 'Identify deprecated API use and update your applications',
  }),
  toggleTitle: i18n.translate('xpack.upgradeAssistant.overview.toggleTitle', {
    defaultMessage: 'Log Elasticsearch deprecation issues',
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
  deniedPrivilegeTitle: i18n.translate(
    'xpack.upgradeAssistant.overview.deprecationLogs.deniedPrivilegeTitle',
    {
      defaultMessage: `You're missing index privileges`,
    }
  ),
  deniedPrivilegeDescription: (privilegesMissing: MissingPrivileges) =>
    i18n.translate('xpack.upgradeAssistant.overview.deprecationLogs.deniedPrivilegeDescription', {
      defaultMessage:
        'To be able to analyze deprecataion logs, you must have {privilegesCount, plural, one {this index privilege} other {these index privileges}}: {missingPrivileges}',
      values: {
        missingPrivileges: privilegesMissing?.index!.join(', '),
        privilegesCount: privilegesMissing?.index!.length,
      },
    }),
};

interface Props {
  setIsComplete: OverviewStepProps['setIsComplete'];
  hasPrivileges: boolean;
  privilegesMissing: MissingPrivileges;
}

const FixLogsStep: FunctionComponent<Props> = ({
  setIsComplete,
  hasPrivileges,
  privilegesMissing,
}) => {
  const state = useDeprecationLogging();
  const [checkpoint, setCheckpoint] = useState(loadLogsCheckpoint());

  useEffect(() => {
    saveLogsCheckpoint(checkpoint);
  }, [checkpoint]);

  useEffect(() => {
    if (!state.isDeprecationLogIndexingEnabled) {
      setIsComplete(false);
    }

    // Depending upon setIsComplete would create an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isDeprecationLogIndexingEnabled]);

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

      {!hasPrivileges && state.isDeprecationLogIndexingEnabled && (
        <>
          <EuiSpacer size="m" />
          <EuiCallOut
            iconType="help"
            color="warning"
            title={i18nTexts.deniedPrivilegeTitle}
            data-test-subj="noIndexPermissionsCallout"
          >
            <p>{i18nTexts.deniedPrivilegeDescription(privilegesMissing)}</p>
          </EuiCallOut>
        </>
      )}

      {hasPrivileges && state.isDeprecationLogIndexingEnabled && (
        <>
          <EuiSpacer size="xl" />
          <EuiText data-test-subj="externalLinksTitle">
            <h4>{i18nTexts.analyzeTitle}</h4>
          </EuiText>
          <EuiSpacer size="m" />
          <ExternalLinks checkpoint={checkpoint} />

          <EuiSpacer size="xl" />
          <EuiText data-test-subj="deprecationsCountTitle">
            <h4>{i18nTexts.deprecationsCountCheckpointTitle}</h4>
          </EuiText>
          <EuiSpacer size="m" />
          <DeprecationsCountCheckpoint
            checkpoint={checkpoint}
            setCheckpoint={setCheckpoint}
            setHasNoDeprecationLogs={setIsComplete}
          />
        </>
      )}
    </>
  );
};

export const getFixLogsStep = ({ isComplete, setIsComplete }: OverviewStepProps): EuiStepProps => {
  const status = isComplete ? 'complete' : 'incomplete';

  return {
    status,
    title: i18nTexts.identifyStepTitle,
    'data-test-subj': `fixLogsStep-${status}`,
    children: (
      <WithPrivileges privileges={`index.${DEPRECATION_LOGS_INDEX}`}>
        {({ hasPrivileges, privilegesMissing, isLoading }) => (
          <FixLogsStep
            setIsComplete={setIsComplete}
            hasPrivileges={!isLoading && hasPrivileges}
            privilegesMissing={privilegesMissing}
          />
        )}
      </WithPrivileges>
    ),
  };
};
