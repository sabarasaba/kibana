/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiButtonEmpty,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiTextColor,
  EuiLink,
} from '@elastic/eui';

import { EnrichedDeprecationInfo } from '../../../../../../common/types';
import { DeprecationBadge } from '../../../shared';

export interface DefaultDeprecationFlyoutProps {
  deprecation: EnrichedDeprecationInfo;
  closeFlyout: () => void;
}

const i18nTexts = {
  getFlyoutDescription: (indexName: string) =>
    i18n.translate(
      'xpack.upgradeAssistant.esDeprecations.deprecationDetailsFlyout.secondaryDescription',
      {
        defaultMessage: 'Index: {indexName}',
        values: {
          indexName,
        },
      }
    ),
  learnMoreLinkLabel: i18n.translate(
    'xpack.upgradeAssistant.esDeprecations.deprecationDetailsFlyout.learnMoreLinkLabel',
    {
      defaultMessage: 'Learn more about this deprecation',
    }
  ),
  closeButtonLabel: i18n.translate(
    'xpack.upgradeAssistant.esDeprecations.deprecationDetailsFlyout.closeButtonLabel',
    {
      defaultMessage: 'Close',
    }
  ),
};

export const DefaultDeprecationFlyout = ({
  deprecation,
  closeFlyout,
}: DefaultDeprecationFlyoutProps) => {
  const { message, url, details, index } = deprecation;

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup direction="column" gutterSize="s">
          <EuiFlexItem>
            <div>
              <DeprecationBadge isCritical={deprecation.isCritical} isResolved={false} />
            </div>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="s" data-test-subj="flyoutTitle">
              <h2 id="defaultDeprecationDetailsFlyoutTitle">{message}</h2>
            </EuiTitle>
            {index && (
              <EuiText data-test-subj="flyoutDescription">
                <p>
                  <EuiTextColor color="subdued">
                    {i18nTexts.getFlyoutDescription(index)}
                  </EuiTextColor>
                </p>
              </EuiText>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiText>
          <p className="eui-textBreakWord">{details}</p>
          <p>
            <EuiLink target="_blank" href={url}>
              {i18nTexts.learnMoreLinkLabel}
            </EuiLink>
          </p>
        </EuiText>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={closeFlyout} flush="left">
              {i18nTexts.closeButtonLabel}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
};
