/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent } from 'react';
import { EuiInMemoryTable, EuiBasicTableColumn, EuiSearchBarProps, EuiButton } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import type { SerializedEnrichPolicy } from '../../../../../../common/types';

export interface Props {
  policies: SerializedEnrichPolicy[];
  onReloadClick: () => void;
  onDeletePolicyClick: (policyName: string) => void;
  onExecutePolicyClick: (policyName: string) => void;
}

const pagination = {
  initialPageSize: 5,
  pageSizeOptions: [3, 5, 8],
};

export const PoliciesTable: FunctionComponent<Props> = ({
  policies,
  onReloadClick,
  onDeletePolicyClick,
  onExecutePolicyClick,
}) => {
  const renderToolsRight = () => {
    return [
      <EuiButton
        key="reloadPolicies"
        data-test-subj="reloadPoliciesButton"
        iconType="refresh"
        color="success"
        onClick={onReloadClick}
      >
        <FormattedMessage
          id="xpack.idxMgmt.enrich_policies.table.reloadButton"
          defaultMessage="Reload"
        />
      </EuiButton>,
      <EuiButton key="createPolicy" fill iconType="plusInCircle">
        <FormattedMessage
          id="xpack.idxMgmt.enrich_policies.table.createPolicyButton"
          defaultMessage="Create enrich policy"
        />
      </EuiButton>,
    ];
  };

  const search: EuiSearchBarProps = {
    toolsRight: renderToolsRight(),
    box: {
      incremental: true,
    },
  };

  const columns: Array<EuiBasicTableColumn<SerializedEnrichPolicy>> = [
    {
      field: 'name',
      name: i18n.translate('xpack.idxMgmt.enrich_policies.table.nameField', {
        defaultMessage: 'Name',
      }),
      sortable: true,
      truncateText: true,
    },
    {
      field: 'type',
      name: i18n.translate('xpack.idxMgmt.enrich_policies.table.typeField', {
        defaultMessage: 'Type',
      }),
      sortable: true,
    },
    {
      field: 'sourceIndices',
      name: i18n.translate('xpack.idxMgmt.enrich_policies.table.sourceIndicesField', {
        defaultMessage: 'Source indices',
      }),
      truncateText: true,
      render: (indices: string[]) => indices.join(', '),
    },
    {
      field: 'matchField',
      name: i18n.translate('xpack.idxMgmt.enrich_policies.table.matchFieldField', {
        defaultMessage: 'Match field',
      }),
      truncateText: true,
    },
    {
      field: 'enrichFields',
      name: i18n.translate('xpack.idxMgmt.enrich_policies.table.enrichFieldsField', {
        defaultMessage: 'Enrich fields',
      }),
      truncateText: false,
      render: (fields: string[]) => fields.join(', '),
    },
    {
      name: i18n.translate('xpack.idxMgmt.enrich_policies.table.actionsField', {
        defaultMessage: 'Actions',
      }),
      actions: [
        {
          isPrimary: true,
          name: i18n.translate('xpack.idxMgmt.enrich_policies.table.executeAction', {
            defaultMessage: 'Execute',
          }),
          description: i18n.translate('xpack.idxMgmt.enrich_policies.table.executeDescription', {
            defaultMessage: 'Execute this enrich policy',
          }),
          type: 'icon',
          icon: 'play',
          'data-test-subj': 'executePolicyButton',
          onClick: ({ name }) => onExecutePolicyClick(name),
        },
        {
          isPrimary: true,
          name: i18n.translate('xpack.idxMgmt.enrich_policies.table.deleteAction', {
            defaultMessage: 'Delete',
          }),
          description: i18n.translate('xpack.idxMgmt.enrich_policies.table.deleteDescription', {
            defaultMessage: 'Delete this enrich policy',
          }),
          type: 'icon',
          icon: 'trash',
          color: 'danger',
          'data-test-subj': 'deletePolicyButton',
          onClick: ({ name }) => onDeletePolicyClick(name),
        },
      ],
    },
  ];

  return (
    <EuiInMemoryTable
      data-test-subj="enrichPoliciesTable"
      items={policies}
      itemId="name"
      columns={columns}
      search={search}
      pagination={pagination}
      sorting={true}
      isSelectable={false}
    />
  );
};
