/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiLink, EuiText, EuiToolTip } from '@elastic/eui';
import { EnrichedDeprecationInfo } from '../../../../common/types';
import { DEPRECATION_TYPE_MAP } from '../constants';
import { DeprecationTableColumns } from '../types';
import { DeprecationBadge } from '../shared';

interface Props {
  resolutionTableCell?: React.ReactNode;
  fieldName: DeprecationTableColumns;
  deprecation: EnrichedDeprecationInfo;
  isResolved: boolean;
  openFlyout: () => void;
}

const i18nTexts = {
  manualCellLabel: i18n.translate(
    'xpack.upgradeAssistant.esDeprecations.defaultDeprecation.manualCellLabel',
    {
      defaultMessage: 'Manual',
    }
  ),
  manualCellTooltipLabel: i18n.translate(
    'xpack.upgradeAssistant.esDeprecations.reindex.manualCellTooltipLabel',
    {
      defaultMessage: 'Resolve this deprecation manually.',
    }
  ),
};

export const EsDeprecationsTableCells: React.FunctionComponent<Props> = ({
  resolutionTableCell,
  fieldName,
  deprecation,
  openFlyout,
  isResolved,
}) => {
  // "Status column"
  if (fieldName === 'isCritical') {
    return <DeprecationBadge isCritical={deprecation.isCritical} isResolved={isResolved} />;
  }

  // "Issue" column
  if (fieldName === 'message') {
    return (
      <EuiLink
        data-test-subj={`deprecation-${deprecation.correctiveAction?.type ?? 'default'}`}
        onClick={openFlyout}
      >
        {deprecation.message}
      </EuiLink>
    );
  }

  // "Type" column
  if (fieldName === 'type') {
    return <>{DEPRECATION_TYPE_MAP[deprecation.type as EnrichedDeprecationInfo['type']]}</>;
  }

  // "Resolution column"
  if (fieldName === 'correctiveAction') {
    if (resolutionTableCell) {
      return <>{resolutionTableCell}</>;
    }

    return (
      <EuiToolTip position="top" content={i18nTexts.manualCellTooltipLabel}>
        <EuiText size="s" color="subdued">
          {i18nTexts.manualCellLabel}
        </EuiText>
      </EuiToolTip>
    );
  }

  // Default behavior: render value or empty string if undefined
  return <>{deprecation[fieldName] ?? ''}</>;
};
