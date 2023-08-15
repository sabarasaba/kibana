/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent } from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiFlyoutFooter,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
} from '@elastic/eui';
import { CodeEditor } from '@kbn/kibana-react-plugin/public';
import type { SerializedEnrichPolicy } from '../../../../../../common';

export interface Props {
  policy: SerializedEnrichPolicy;
  onClose: () => void;
}

export const PolicyDetailsFlyout: FunctionComponent<Props> = ({ policy, onClose }) => {
  return (
    <EuiFlyout onClose={onClose} data-test-subj="policyDetailsFlyout" size="m" maxWidth={550}>
      <EuiFlyoutHeader>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiTitle id="policyDetailsFlyoutTitle" data-test-subj="title">
              <h2>{policy.name}</h2>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiDescriptionList>
          {/* Policy type */}
          {policy.type && (
            <>
              <EuiDescriptionListTitle>
                {i18n.translate('xpack.idxMgmt.enrich_policies.detailsFlyout.typeTitle', {
                  defaultMessage: 'Type',
                })}
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>{policy.type}</EuiDescriptionListDescription>
            </>
          )}

          {/* Policy source indices */}
          {policy.sourceIndices && (
            <>
              <EuiDescriptionListTitle>
                {i18n.translate('xpack.idxMgmt.enrich_policies.detailsFlyout.sourceIndicesTitle', {
                  defaultMessage: 'Source indices',
                })}
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                {policy.sourceIndices.join(', ')}
              </EuiDescriptionListDescription>
            </>
          )}

          {/* Policy match field */}
          {policy.matchField && (
            <>
              <EuiDescriptionListTitle>
                {i18n.translate('xpack.idxMgmt.enrich_policies.detailsFlyout.matchFieldTitle', {
                  defaultMessage: 'Match field',
                })}
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>{policy.matchField}</EuiDescriptionListDescription>
            </>
          )}

          {/* Policy enrich fields */}
          {policy.enrichFields && (
            <>
              <EuiDescriptionListTitle>
                {i18n.translate('xpack.idxMgmt.enrich_policies.detailsFlyout.enrichFieldsTitle', {
                  defaultMessage: 'Enrich fields',
                })}
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                {policy.enrichFields.join(', ')}
              </EuiDescriptionListDescription>
            </>
          )}

          {/* Policy query */}
          {policy.query && (
            <>
              <EuiDescriptionListTitle>
                {i18n.translate('xpack.idxMgmt.enrich_policies.detailsFlyout.queryTitle', {
                  defaultMessage: 'Query',
                })}
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                <CodeEditor
                  languageId="json"
                  value={JSON.stringify(policy.query, null, 2)}
                  data-test-subj="queryEditor"
                  height={250}
                  options={{
                    lineNumbers: 'off',
                    tabSize: 2,
                    automaticLayout: true,
                  }}
                  aria-label={i18n.translate(
                    'xpack.idxMgmt.enrich_policies.detailsFlyout.queryAriaLabel',
                    { defaultMessage: 'Enrich policy query editor' }
                  )}
                />
              </EuiDescriptionListDescription>
            </>
          )}
        </EuiDescriptionList>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="cross" onClick={onClose} flush="left">
              {i18n.translate('xpack.idxMgmt.enrich_policies.detailsFlyout.closeButton', {
                defaultMessage: 'Close',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
