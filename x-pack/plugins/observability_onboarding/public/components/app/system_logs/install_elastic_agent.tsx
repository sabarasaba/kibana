/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { default as React, useCallback, useEffect, useState } from 'react';
import { useWizard } from '.';
import { FETCH_STATUS, useFetcher } from '../../../hooks/use_fetcher';
import { useKibanaNavigation } from '../../../hooks/use_kibana_navigation';
import {
  ElasticAgentPlatform,
  getElasticAgentSetupCommand,
} from '../../shared/get_elastic_agent_setup_command';
import {
  InstallElasticAgentSteps,
  ProgressStepId,
  EuiStepStatus,
} from '../../shared/install_elastic_agent_steps';
import {
  StepPanel,
  StepPanelContent,
  StepPanelFooter,
} from '../../shared/step_panel';
import { ApiKeyBanner } from '../custom_logs/wizard/api_key_banner';

export function InstallElasticAgent() {
  const { navigateToKibanaUrl } = useKibanaNavigation();
  const { getState, setState } = useWizard();
  const wizardState = getState();
  const [elasticAgentPlatform, setElasticAgentPlatform] =
    useState<ElasticAgentPlatform>('linux-tar');

  const datasetName = 'elastic-agent';
  const namespace = 'default';

  function onBack() {
    navigateToKibanaUrl('/app/observabilityOnboarding');
  }
  function onContinue() {
    navigateToKibanaUrl('/app/logs/stream');
  }

  function onAutoDownloadConfig() {
    setState((state) => ({
      ...state,
      autoDownloadConfig: !state.autoDownloadConfig,
    }));
  }

  const { data: monitoringRole, status: monitoringRoleStatus } = useFetcher(
    (callApi) => {
      return callApi(
        'GET /internal/observability_onboarding/logs/setup/privileges'
      );
    },
    []
  );

  const { data: setup } = useFetcher((callApi) => {
    return callApi(
      'GET /internal/observability_onboarding/logs/setup/environment'
    );
  }, []);

  const {
    data: installShipperSetup,
    status: installShipperSetupStatus,
    error,
  } = useFetcher(
    (callApi) => {
      if (monitoringRole?.hasPrivileges) {
        return callApi('POST /internal/observability_onboarding/logs/flow', {
          params: {
            body: {
              name: datasetName,
              state: {
                datasetName,
                namespace,
              },
            },
          },
        });
      }
    },
    [monitoringRole?.hasPrivileges]
  );

  const { status: saveOnboardingStateDataStatus } = useFetcher((callApi) => {
    const { onboardingId } = getState();
    if (onboardingId) {
      return callApi(
        'PUT /internal/observability_onboarding/flow/{onboardingId}',
        {
          params: {
            path: { onboardingId },
            body: {
              state: {
                datasetName,
                namespace,
              },
            },
          },
        }
      );
    }
  }, []);

  const { apiKeyEncoded, onboardingId } = installShipperSetup ?? getState();

  const { data: yamlConfig = '', status: yamlConfigStatus } = useFetcher(
    (callApi) => {
      if (apiKeyEncoded && onboardingId) {
        return callApi(
          'GET /internal/observability_onboarding/elastic_agent/config',
          {
            headers: { authorization: `ApiKey ${apiKeyEncoded}` },
            params: { query: { onboardingId } },
          }
        );
      }
    },
    [
      apiKeyEncoded,
      onboardingId,
      saveOnboardingStateDataStatus === FETCH_STATUS.SUCCESS,
    ]
  );

  useEffect(() => {
    setState((state) => ({ ...state, onboardingId, apiKeyEncoded }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingId, apiKeyEncoded]);

  const {
    data: progressData,
    status: progressStatus,
    refetch: refetchProgress,
  } = useFetcher(
    (callApi) => {
      if (onboardingId) {
        return callApi(
          'GET /internal/observability_onboarding/flow/{onboardingId}/progress',
          { params: { path: { onboardingId } } }
        );
      }
    },
    [onboardingId]
  );

  const progressSucceded = progressStatus === FETCH_STATUS.SUCCESS;

  useEffect(() => {
    if (progressSucceded) {
      setTimeout(() => {
        refetchProgress();
      }, 2000);
    }
  }, [progressSucceded, refetchProgress]);

  const getCheckLogsStep = useCallback(() => {
    const progress = progressData?.progress;
    if (progress) {
      const stepStatus = progress?.['logs-ingest']?.status as EuiStepStatus;
      const title =
        stepStatus === 'loading'
          ? CHECK_LOGS_LABELS.loading
          : stepStatus === 'complete'
          ? CHECK_LOGS_LABELS.completed
          : CHECK_LOGS_LABELS.incomplete;
      return { title, status: stepStatus };
    }
    return {
      title: CHECK_LOGS_LABELS.incomplete,
      status: 'incomplete' as const,
    };
  }, [progressData?.progress]);

  const isInstallStarted = progressData?.progress['ea-download'] !== undefined;
  const isInstallCompleted =
    progressData?.progress?.['ea-status']?.status === 'complete';
  const autoDownloadConfigStatus = progressData?.progress?.['ea-config']
    ?.status as EuiStepStatus;

  return (
    <StepPanel
      panelFooter={
        <StepPanelFooter
          items={[
            <EuiButton color="text" onClick={onBack}>
              {i18n.translate(
                'xpack.observability_onboarding.systemLogs.back',
                { defaultMessage: 'Back' }
              )}
            </EuiButton>,
            <EuiFlexGroup justifyContent="flexEnd" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="success"
                  fill
                  iconType="magnifyWithPlus"
                  onClick={onContinue}
                >
                  {i18n.translate(
                    'xpack.observability_onboarding.steps.exploreLogs',
                    { defaultMessage: 'Explore logs' }
                  )}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>,
          ]}
        />
      }
    >
      <StepPanelContent>
        <EuiText color="subdued">
          <p>
            {i18n.translate(
              'xpack.observability_onboarding.systemLogs.installElasticAgent.description',
              {
                defaultMessage:
                  'To collect the data from your system and stream it to Elastic, you first need to install a shipping tool on the machine generating the logs. In this case, the shipper is an Agent developed by Elastic.',
              }
            )}
          </p>
        </EuiText>
        <EuiSpacer size="m" />
        {apiKeyEncoded && onboardingId ? (
          <ApiKeyBanner
            payload={{ apiKeyEncoded, onboardingId }}
            hasPrivileges
            status={FETCH_STATUS.SUCCESS}
          />
        ) : (
          monitoringRoleStatus !== FETCH_STATUS.NOT_INITIATED &&
          monitoringRoleStatus !== FETCH_STATUS.LOADING && (
            <ApiKeyBanner
              payload={installShipperSetup}
              hasPrivileges={monitoringRole?.hasPrivileges}
              status={installShipperSetupStatus}
              error={error}
            />
          )
        )}
        <EuiSpacer size="m" />
        <InstallElasticAgentSteps
          installAgentPlatformOptions={[
            { label: 'Linux', id: 'linux-tar', isDisabled: false },
            { label: 'MacOS', id: 'macos', isDisabled: false },
            { label: 'Windows', id: 'windows', isDisabled: true },
          ]}
          onSelectPlatform={(id) => setElasticAgentPlatform(id)}
          selectedPlatform={elasticAgentPlatform}
          installAgentCommand={getElasticAgentSetupCommand({
            elasticAgentPlatform,
            apiKeyEncoded,
            apiEndpoint: setup?.apiEndpoint,
            scriptDownloadUrl: setup?.scriptDownloadUrl,
            elasticAgentVersion: setup?.elasticAgentVersion,
            autoDownloadConfig: wizardState.autoDownloadConfig,
            onboardingId,
          })}
          autoDownloadConfig={wizardState.autoDownloadConfig}
          onToggleAutoDownloadConfig={onAutoDownloadConfig}
          installAgentStatus={
            installShipperSetupStatus === FETCH_STATUS.LOADING
              ? 'loading'
              : isInstallCompleted
              ? 'complete'
              : 'current'
          }
          showInstallProgressSteps={isInstallStarted}
          installProgressSteps={
            (progressData?.progress ?? {}) as Partial<
              Record<
                ProgressStepId,
                { status: EuiStepStatus; message?: string }
              >
            >
          }
          configureAgentStatus={
            yamlConfigStatus === FETCH_STATUS.LOADING
              ? 'loading'
              : autoDownloadConfigStatus
          }
          configureAgentYaml={yamlConfig}
          appendedSteps={[getCheckLogsStep()]}
        />
      </StepPanelContent>
    </StepPanel>
  );
}

const CHECK_LOGS_LABELS = {
  incomplete: i18n.translate(
    'xpack.observability_onboarding.systemLogs.installElasticAgent.progress.logsIngest.incompleteTitle',
    { defaultMessage: 'Ship logs to Elastic Observability' }
  ),
  loading: i18n.translate(
    'xpack.observability_onboarding.systemLogs.installElasticAgent.progress.logsIngest.loadingTitle',
    { defaultMessage: 'Waiting for logs to be shipped...' }
  ),
  completed: i18n.translate(
    'xpack.observability_onboarding.systemLogs.installElasticAgent.progress.logsIngest.completedTitle',
    { defaultMessage: 'Logs are being shipped!' }
  ),
};
