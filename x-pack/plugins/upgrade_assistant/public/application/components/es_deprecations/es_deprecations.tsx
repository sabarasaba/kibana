/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import {
  EuiPageHeader,
  EuiSpacer,
  EuiPageContent,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

import { EnrichedDeprecationInfo } from '../../../../common/types';
import { SectionLoading } from '../../../shared_imports';
import { useServices } from '../../app_context';
import { EsDeprecationsTable } from './es_deprecations_table';
import { EsDeprecationErrors } from './es_deprecation_errors';
import { NoDeprecationsPrompt } from '../shared';

const getDeprecationCountByLevel = (deprecations: EnrichedDeprecationInfo[]) => {
  const criticalDeprecations: EnrichedDeprecationInfo[] = [];
  const warningDeprecations: EnrichedDeprecationInfo[] = [];

  deprecations.forEach((deprecation) => {
    if (deprecation.isCritical) {
      criticalDeprecations.push(deprecation);
      return;
    }
    warningDeprecations.push(deprecation);
  });

  return {
    criticalDeprecations: criticalDeprecations.length,
    warningDeprecations: warningDeprecations.length,
  };
};

const i18nTexts = {
  pageTitle: i18n.translate('xpack.upgradeAssistant.esDeprecations.pageTitle', {
    defaultMessage: 'Elasticsearch deprecation warnings',
  }),
  pageDescription: i18n.translate('xpack.upgradeAssistant.esDeprecations.pageDescription', {
    defaultMessage:
      'You must resolve all critical issues before upgrading. Back up recommended. Make sure you have a current snapshot before modifying your configuration or reindexing.',
  }),
  isLoading: i18n.translate('xpack.upgradeAssistant.esDeprecations.loadingText', {
    defaultMessage: 'Loading deprecations…',
  }),
  getCriticalStatusLabel: (count: number) =>
    i18n.translate('xpack.upgradeAssistant.esDeprecations.criticalStatusLabel', {
      defaultMessage: 'Critical: {count}',
      values: {
        count,
      },
    }),
  getWarningStatusLabel: (count: number) =>
    i18n.translate('xpack.upgradeAssistant.esDeprecations.warningStatusLabel', {
      defaultMessage: 'Warning: {count}',
      values: {
        count,
      },
    }),
};

export const EsDeprecations = withRouter(({ history }: RouteComponentProps) => {
  const { api, breadcrumbs } = useServices();

  const {
    data: esDeprecations,
    isLoading,
    error,
    resendRequest,
    isInitialRequest,
  } = api.useLoadEsDeprecations();

  const deprecationsCountByLevel: {
    warningDeprecations: number;
    criticalDeprecations: number;
  } = useMemo(() => getDeprecationCountByLevel(esDeprecations?.deprecations || []), [
    esDeprecations?.deprecations,
  ]);

  useEffect(() => {
    breadcrumbs.setBreadcrumbs('esDeprecations');
  }, [breadcrumbs]);

  useEffect(() => {
    if (isLoading === false && isInitialRequest) {
      async function sendTelemetryData() {
        await api.sendPageTelemetryData({
          elasticsearch: true,
        });
      }

      sendTelemetryData();
    }
  }, [api, isLoading, isInitialRequest]);

  if (error) {
    return <EsDeprecationErrors error={error} />;
  }

  if (isLoading) {
    return (
      <EuiPageContent verticalPosition="center" horizontalPosition="center" color="subdued">
        <SectionLoading>{i18nTexts.isLoading}</SectionLoading>
      </EuiPageContent>
    );
  }

  if (esDeprecations?.deprecations?.length === 0) {
    return (
      <EuiPageContent verticalPosition="center" horizontalPosition="center" color="subdued">
        <NoDeprecationsPrompt
          deprecationType="Elasticsearch"
          navigateToOverviewPage={() => history.push('/overview')}
        />
      </EuiPageContent>
    );
  }

  return (
    <div data-test-subj="esDeprecationsContent">
      <EuiPageHeader pageTitle={i18nTexts.pageTitle} description={i18nTexts.pageDescription}>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiHealth color="danger" data-test-subj="criticalDeprecationsCount">
              {i18nTexts.getCriticalStatusLabel(deprecationsCountByLevel.criticalDeprecations)}
            </EuiHealth>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiHealth color="subdued" data-test-subj="warningDeprecationsCount">
              {i18nTexts.getWarningStatusLabel(deprecationsCountByLevel.warningDeprecations)}
            </EuiHealth>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageHeader>

      <EuiSpacer size="l" />

      <EsDeprecationsTable deprecations={esDeprecations?.deprecations} reload={resendRequest} />
    </div>
  );
});
