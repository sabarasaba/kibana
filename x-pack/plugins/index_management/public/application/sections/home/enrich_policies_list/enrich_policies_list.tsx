/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiSpacer, EuiText, EuiLink } from '@elastic/eui';

import { APP_WRAPPER_CLASS, useExecutionContext } from '../../../../shared_imports';
import { useAppContext } from '../../../app_context';

import { documentationService } from '../../../services/documentation';
import { useLoadEnrichPolicies } from '../../../services/api';
import { PageLoading, PageError } from '../../../../shared_imports';
import { PoliciesTable } from './policies_table';
import { DeletePolicyModal, ExecutePolicyModal } from './confirm_modals';

export const EnrichPoliciesList = () => {
  const {
    core: { executionContext },
  } = useAppContext();

  useExecutionContext(executionContext, {
    type: 'application',
    page: 'indexManagementEnrichPoliciesTab',
  });

  const [policyToDelete, setPolicyToDelete] = useState<string | undefined>();
  const [policyToExecute, setPolicyToExecute] = useState<string | undefined>();

  const { error, isLoading, data: policies, resendRequest: reloadPolicies } = useLoadEnrichPolicies();

  if (isLoading) {
    return (
      <PageLoading>
        <FormattedMessage
          id="xpack.idxMgmt.enrich_policies.list.loadingStateLabel"
          defaultMessage="Loading enrich policies…"
        />
      </PageLoading>
    );
  }

  if (error) {
    return (
      <PageError
        data-test-subj="sectionError"
        title={
          <FormattedMessage
            id="xpack.idxMgmt.enrich_policies.list.errorStateLabel"
            defaultMessage="Error loading enrich policies"
          />
        }
        error={error}
      />
    );
  }

  return (
    <div className={APP_WRAPPER_CLASS} data-test-subj="enrichPoliciesList">
      <EuiText color="subdued">
        <FormattedMessage
          id="xpack.idxMgmt.enrich_policies.list.descriptionTitle"
          defaultMessage="Enrich policies allow you to enrich your data by adding context via additional data. {learnMoreLink}"
          values={{
            learnMoreLink: (
              <EuiLink href={documentationService.getEnrichApisLink()} target="_blank" external>
                <FormattedMessage
                  id="xpack.idxMgmt.enrich_policies.list.docsLink"
                  defaultMessage="Learn more"
                />
              </EuiLink>
            ),
          }}
        />
      </EuiText>
      <EuiSpacer size="l" />

      <PoliciesTable
        policies={policies}
        onReloadClick={reloadPolicies}
        onDeletePolicyClick={setPolicyToDelete}
        onExecutePolicyClick={setPolicyToExecute}
      />

      {policyToDelete && (
        <DeletePolicyModal
          policyToDelete={policyToDelete}
          callback={(deleteResponse) => {
            if (deleteResponse?.hasDeletedPolicy) {
              reloadPolicies();
            }
            setPolicyToDelete(undefined);
          }}
        />
      )}

      {policyToExecute && (
        <ExecutePolicyModal
          policyToExecute={policyToExecute}
          callback={(executeResponse) => {
            if (executeResponse?.hasExecutedPolicy) {
              reloadPolicies();
            }
            setPolicyToExecute(undefined);
          }}
        />
      )}
    </div>
  );
};
