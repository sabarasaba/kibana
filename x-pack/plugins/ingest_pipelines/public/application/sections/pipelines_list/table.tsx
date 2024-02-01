/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent, useState, useMemo } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiInMemoryTable,
  EuiLink,
  EuiButton,
  EuiInMemoryTableProps,
  EuiTableFieldDataColumnType,
  EuiPopover,
  EuiContextMenu,
  EuiBadge,
  EuiToolTip,
  EuiSearchBarProps,
  EuiFilterGroup,
  EuiSelectable,
  EuiPopoverTitle,
  EuiFilterButton,
  EuiSearchBar,
  EuiSelectableOption,
} from '@elastic/eui';
import { reactRouterNavigate } from '@kbn/kibana-react-plugin/public';

import { Pipeline } from '../../../../common/types';
import { useKibana } from '../../../shared_imports';
import { fuzzyMatch } from '../../lib/utils';

export interface Props {
  pipelines: Pipeline[];
  onReloadClick: () => void;
  onEditPipelineClick: (pipelineName: string) => void;
  onClonePipelineClick: (pipelineName: string) => void;
  onDeletePipelineClick: (pipelineName: string[]) => void;
}

export const deprecatedPipelineBadge = {
  badge: i18n.translate('xpack.ingestPipelines.list.table.deprecatedBadgeLabel', {
    defaultMessage: 'Deprecated',
  }),
  badgeTooltip: i18n.translate('xpack.ingestPipelines.list.table.deprecatedBadgeTooltip', {
    defaultMessage:
      'This pipeline is no longer supported and might be removed in a future release. Instead, use one of the other pipelines available or create a new one.',
  }),
};

export const PipelineTable: FunctionComponent<Props> = ({
  pipelines,
  onReloadClick,
  onEditPipelineClick,
  onClonePipelineClick,
  onDeletePipelineClick,
}) => {
  // In order to have the filters detached from the search bar, we will keep the filters and the
  // search bar state separated. The search bar will be responsible for updating the search state
  // and the filters will be responsible for updating the query state.
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('-is:Deprecated');
  // By default, we want to show all the pipelines that are not deprecated.
  const [filterOptions, setFilterOptions] = useState([
    { label: 'Managed' },
    { label: 'Deprecated', checked: 'off' },
  ]);

  const { history } = useKibana().services;
  const [selection, setSelection] = useState<Pipeline[]>([]);
  const [showPopover, setShowPopover] = useState(false);

  const createMenuItems = [
    /**
     * Create pipeline
     */
    {
      name: i18n.translate('xpack.ingestPipelines.list.table.createPipelineButtonLabel', {
        defaultMessage: 'New pipeline',
      }),
      ...reactRouterNavigate(history, '/create'),
      'data-test-subj': `createNewPipeline`,
    },
    /**
     * Create pipeline from CSV
     */
    {
      name: i18n.translate('xpack.ingestPipelines.list.table.createPipelineFromCsvButtonLabel', {
        defaultMessage: 'New pipeline from CSV',
      }),
      ...reactRouterNavigate(history, '/csv_create'),
      'data-test-subj': `createPipelineFromCsv`,
    },
  ];

  const handleOnChange: EuiSearchBarProps['onChange'] = ({ queryText, error }) => {
    if (!error) {
      setSearch(queryText);
    }
  };

  // We need to filter the pipelines based on the search bar and the filter query.
  const filteredPipelines = useMemo(() => {
    const parsedQuery = EuiSearchBar.Query.parse(query);
    const deprecatedClause = parsedQuery.getIsClause('Deprecated');
    const managedClause = parsedQuery.getIsClause('Managed');

    return (pipelines || [])
      .filter((pipeline) => {
        if (
          (deprecatedClause?.match === 'must_not' && pipeline.deprecated) ||
          (managedClause?.match === 'must_not' && pipeline.isManaged) ||
          (managedClause?.match === 'must' && !pipeline.isManaged) ||
          (deprecatedClause?.match === 'must' && !pipeline.deprecated)
        ) {
          return false;
        }

        if (search.trim() === '') {
          return true;
        }

        return fuzzyMatch(search, pipeline.name);
      })
      .sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        }
        return 0;
      });
  }, [pipelines, query, search]);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };
  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const button = (
    <EuiFilterButton
      iconType="arrowDown"
      badgeColor="success"
      onClick={onButtonClick}
      isSelected={isPopoverOpen}
      numFilters={filterOptions.filter((item) => item.checked !== 'off').length}
      hasActiveFilters={!!filterOptions.find((item) => item.checked === 'on')}
      numActiveFilters={filterOptions.filter((item) => item.checked === 'on').length}
    >
      {i18n.translate('xpack.ingestPipelines.list.table.filtersButtonLabel', {
        defaultMessage: 'Filters',
      })}
    </EuiFilterButton>
  );

  const tableProps: EuiInMemoryTableProps<Pipeline> = {
    itemId: 'name',
    isSelectable: true,
    'data-test-subj': 'pipelinesTable',
    sorting: { sort: { field: 'name', direction: 'asc' } },
    selection: {
      onSelectionChange: setSelection,
    },
    rowProps: () => ({
      'data-test-subj': 'pipelineTableRow',
    }),
    cellProps: (pipeline, column) => {
      const { field } = column as EuiTableFieldDataColumnType<Pipeline>;

      return {
        'data-test-subj': `pipelineTableRow-${field}`,
      };
    },
    search: {
      toolsLeft:
        selection.length > 0 ? (
          <EuiButton
            data-test-subj="deletePipelinesButton"
            onClick={() => onDeletePipelineClick(selection.map((pipeline) => pipeline.name))}
            color="danger"
          >
            <FormattedMessage
              id="xpack.ingestPipelines.list.table.deletePipelinesButtonLabel"
              defaultMessage="Delete {count, plural, one {pipeline} other {pipelines} }"
              values={{ count: selection.length }}
            />
          </EuiButton>
        ) : undefined,
      toolsRight: [
        <EuiButton
          key="reloadButton"
          iconType="refresh"
          color="success"
          data-test-subj="reloadButton"
          onClick={onReloadClick}
        >
          {i18n.translate('xpack.ingestPipelines.list.table.reloadButtonLabel', {
            defaultMessage: 'Reload',
          })}
        </EuiButton>,
        <EuiPopover
          isOpen={showPopover}
          closePopover={() => setShowPopover(false)}
          button={
            <EuiButton
              fill
              iconSide="right"
              iconType="arrowDown"
              data-test-subj="createPipelineDropdown"
              key="createPipelineDropdown"
              onClick={() => setShowPopover((previousBool) => !previousBool)}
            >
              {i18n.translate('xpack.ingestPipelines.list.table.createPipelineDropdownLabel', {
                defaultMessage: 'Create pipeline',
              })}
            </EuiButton>
          }
          panelPaddingSize="none"
          repositionOnScroll
        >
          <EuiContextMenu
            initialPanelId={0}
            data-test-subj="autoFollowPatternActionContextMenu"
            panels={[
              {
                id: 0,
                items: createMenuItems,
              },
            ]}
          />
        </EuiPopover>,
      ],
      box: {
        incremental: true,
      },
      query: search,
      onChange: handleOnChange,
      filters: [
        {
          type: 'custom_component',
          component: ({ query: filterQuery }) => {
            return (
              <EuiFilterGroup>
                <EuiPopover
                  id="popoverID"
                  button={button}
                  isOpen={isPopoverOpen}
                  closePopover={closePopover}
                  panelPaddingSize="none"
                >
                  <EuiSelectable
                    allowExclusions
                    searchable
                    searchProps={{
                      placeholder: i18n.translate(
                        'xpack.ingestPipelines.list.table.filtersListPlaceholder',
                        {
                          defaultMessage: 'Filter list',
                        }
                      ),
                      compressed: true,
                    }}
                    aria-label={i18n.translate(
                      'xpack.ingestPipelines.list.table.filtersAriaLabel',
                      {
                        defaultMessage: 'Filters',
                      }
                    )}
                    options={filterOptions as EuiSelectableOption[]}
                    onChange={(newOptions) => {
                      // Set new options for current state
                      setFilterOptions(newOptions);

                      // Update current query
                      const newQuery = newOptions.reduce((acc, option) => {
                        if (option.checked === 'on') {
                          acc = acc.addMustIsClause(option.label);
                        } else if (option.checked === 'off') {
                          acc = acc.addMustNotIsClause(option.label);
                        } else {
                          acc = acc.removeIsClause(option.label);
                        }

                        return acc;
                      }, filterQuery);

                      setQuery(newQuery.text);
                    }}
                    noMatchesMessage={i18n.translate(
                      'xpack.ingestPipelines.list.table.noFiltersFoundLabel',
                      {
                        defaultMessage: 'No filters found',
                      }
                    )}
                  >
                    {(list, searchText) => (
                      <div style={{ width: 300 }}>
                        <EuiPopoverTitle paddingSize="s">{searchText}</EuiPopoverTitle>
                        {list}
                      </div>
                    )}
                  </EuiSelectable>
                </EuiPopover>
              </EuiFilterGroup>
            );
          },
        },
      ],
    },
    pagination: {
      initialPageSize: 10,
      pageSizeOptions: [10, 20, 50],
    },
    columns: [
      {
        field: 'name',
        name: i18n.translate('xpack.ingestPipelines.list.table.nameColumnTitle', {
          defaultMessage: 'Name',
        }),
        sortable: true,
        render: (name: string, pipeline) => (
          <EuiLink
            data-test-subj="pipelineDetailsLink"
            {...reactRouterNavigate(history, {
              pathname: '/',
              search: `pipeline=${encodeURIComponent(name)}`,
            })}
          >
            {name}
            {pipeline.deprecated && (
              <>
                &nbsp;
                <EuiToolTip content={deprecatedPipelineBadge.badgeTooltip}>
                  <EuiBadge color="warning" data-test-subj="isDeprecatedBadge">
                    {deprecatedPipelineBadge.badge}
                  </EuiBadge>
                </EuiToolTip>
              </>
            )}
            {pipeline.isManaged && (
              <>
                &nbsp;
                <EuiBadge color="hollow" data-test-subj="isManagedBadge">
                  {i18n.translate('xpack.ingestPipelines.list.table.managedBadgeLabel', {
                    defaultMessage: 'Managed',
                  })}
                </EuiBadge>
              </>
            )}
          </EuiLink>
        ),
      },
      {
        name: (
          <FormattedMessage
            id="xpack.ingestPipelines.list.table.actionColumnTitle"
            defaultMessage="Actions"
          />
        ),
        actions: [
          {
            isPrimary: true,
            name: i18n.translate('xpack.ingestPipelines.list.table.editActionLabel', {
              defaultMessage: 'Edit',
            }),
            description: i18n.translate('xpack.ingestPipelines.list.table.editActionDescription', {
              defaultMessage: 'Edit this pipeline',
            }),
            type: 'icon',
            icon: 'pencil',
            onClick: ({ name }) => onEditPipelineClick(name),
          },
          {
            name: i18n.translate('xpack.ingestPipelines.list.table.cloneActionLabel', {
              defaultMessage: 'Clone',
            }),
            description: i18n.translate('xpack.ingestPipelines.list.table.cloneActionDescription', {
              defaultMessage: 'Clone this pipeline',
            }),
            type: 'icon',
            icon: 'copy',
            onClick: ({ name }) => onClonePipelineClick(name),
          },
          {
            isPrimary: true,
            name: i18n.translate('xpack.ingestPipelines.list.table.deleteActionLabel', {
              defaultMessage: 'Delete',
            }),
            description: i18n.translate(
              'xpack.ingestPipelines.list.table.deleteActionDescription',
              { defaultMessage: 'Delete this pipeline' }
            ),
            type: 'icon',
            icon: 'trash',
            color: 'danger',
            onClick: ({ name }) => onDeletePipelineClick([name]),
          },
        ],
      },
    ],
    items: filteredPipelines,
  };

  return <EuiInMemoryTable {...tableProps} />;
};
