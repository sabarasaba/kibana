/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ClassNames } from '@emotion/react';
import React, { useState, useEffect } from 'react';
import {
  EuiInMemoryTable,
  EuiButton,
  EuiLink,
  EuiIconTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBetaBadge,
  EuiToolTip,
  EuiButtonIcon,
  EuiEmptyPrompt,
  Criteria,
  EuiButtonEmpty,
  EuiBadge,
  EuiPageTemplate,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { omit } from 'lodash';
import { FormattedMessage } from '@kbn/i18n-react';
import { withTheme, EuiTheme } from '@kbn/kibana-react-plugin/common';
import { getConnectorCompatibility } from '@kbn/actions-plugin/common';
import { loadAllActions, loadActionTypes, deleteActions } from '../../../lib/action_connector_api';
import {
  hasDeleteActionsCapability,
  hasSaveActionsCapability,
  hasExecuteActionsCapability,
} from '../../../lib/capabilities';
import { DeleteModalConfirmation } from '../../../components/delete_modal_confirmation';
import { checkActionTypeEnabled } from '../../../lib/check_action_type_enabled';
import './actions_connectors_list.scss';
import {
  ActionConnector,
  ActionConnectorTableItem,
  ActionTypeIndex,
  EditConnectorTabs,
} from '../../../../types';
import { EmptyConnectorsPrompt } from '../../../components/prompts/empty_connectors_prompt';
import { useKibana } from '../../../../common/lib/kibana';
import { CenterJustifiedSpinner } from '../../../components/center_justified_spinner';
import {
  connectorDeprecatedMessage,
  deprecatedMessage,
} from '../../../../common/connectors_selection';
import { CreateConnectorFlyout } from '../../action_connector_form/create_connector_flyout';
import { EditConnectorFlyout } from '../../action_connector_form/edit_connector_flyout';
import { getAlertingSectionBreadcrumb } from '../../../lib/breadcrumb';
import { getCurrentDocTitle } from '../../../lib/doc_title';

const ConnectorIconTipWithSpacing = withTheme(({ theme }: { theme: EuiTheme }) => {
  return (
    <ClassNames>
      {({ css }) => (
        <EuiIconTip
          anchorClassName={css({
            /**
             * Adds some spacing to the left of the warning icon for deprecated connectors
             */
            marginLeft: theme.eui.euiSizeS,
            marginBottom: '0 !important',
          })}
          aria-label="Warning"
          size="m"
          type="alert"
          color="warning"
          content={connectorDeprecatedMessage}
          position="right"
        />
      )}
    </ClassNames>
  );
});

const ActionsConnectorsList: React.FunctionComponent = () => {
  const {
    http,
    notifications: { toasts },
    application: { capabilities },
    actionTypeRegistry,
    setBreadcrumbs,
    chrome,
    docLinks,
  } = useKibana().services;
  const canDelete = hasDeleteActionsCapability(capabilities);
  const canExecute = hasExecuteActionsCapability(capabilities);
  const canSave = hasSaveActionsCapability(capabilities);

  const [actionTypesIndex, setActionTypesIndex] = useState<ActionTypeIndex | undefined>(undefined);
  const [actions, setActions] = useState<ActionConnector[]>([]);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<ActionConnectorTableItem[]>([]);
  const [isLoadingActionTypes, setIsLoadingActionTypes] = useState<boolean>(false);
  const [isLoadingActions, setIsLoadingActions] = useState<boolean>(false);
  const [addFlyoutVisible, setAddFlyoutVisibility] = useState<boolean>(false);
  const [editConnectorProps, setEditConnectorProps] = useState<{
    initialConnector?: ActionConnector;
    tab?: EditConnectorTabs;
    isFix?: boolean;
  }>({});
  const [connectorsToDelete, setConnectorsToDelete] = useState<string[]>([]);
  useEffect(() => {
    loadActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showWarningText, setShowWarningText] = useState<boolean>(false);

  // Set breadcrumb and page title
  useEffect(() => {
    setBreadcrumbs([getAlertingSectionBreadcrumb('connectors')]);
    chrome.docTitle.change(getCurrentDocTitle('connectors'));
  }, [chrome, setBreadcrumbs]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoadingActionTypes(true);
        const actionTypes = await loadActionTypes({ http });
        const index: ActionTypeIndex = {};
        for (const actionTypeItem of actionTypes) {
          index[actionTypeItem.id] = actionTypeItem;
        }
        setActionTypesIndex(index);
      } catch (e) {
        toasts.addDanger({
          title: i18n.translate(
            'xpack.triggersActionsUI.sections.actionsConnectorsList.unableToLoadConnectorTypesMessage',
            { defaultMessage: 'Unable to load connector types' }
          ),
        });
      } finally {
        setIsLoadingActionTypes(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionConnectorTableItems: ActionConnectorTableItem[] = actionTypesIndex
    ? actions.map((action) => {
        return {
          ...action,
          actionType: actionTypesIndex[action.actionTypeId]
            ? actionTypesIndex[action.actionTypeId].name
            : action.actionTypeId,
          compatibility: actionTypesIndex[action.actionTypeId]
            ? getConnectorCompatibility(actionTypesIndex[action.actionTypeId].supportedFeatureIds)
            : [],
        };
      })
    : [];

  const actionTypesList: Array<{ value: string; name: string }> = actionTypesIndex
    ? Object.values(actionTypesIndex)
        .map((actionType) => ({
          value: actionType.id,
          name: `${actionType.name} (${getActionsCountByActionType(actions, actionType.id)})`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  function setDeleteConnectorWarning(connectors: string[]) {
    const show = connectors.some((c) => {
      const action = actions.find((a) => a.id === c);
      return (action && action.referencedByCount ? action.referencedByCount : 0) > 0;
    });
    setShowWarningText(show);
  }

  function onDelete(items: ActionConnectorTableItem[]) {
    const itemIds = items.map((item: any) => item.id);
    setConnectorsToDelete(itemIds);
    setDeleteConnectorWarning(itemIds);
  }

  async function loadActions() {
    setIsLoadingActions(true);
    try {
      const actionsResponse = await loadAllActions({ http });
      setActions(actionsResponse);
    } catch (e) {
      toasts.addDanger({
        title: i18n.translate(
          'xpack.triggersActionsUI.sections.actionsConnectorsList.unableToLoadActionsMessage',
          {
            defaultMessage: 'Unable to load connectors',
          }
        ),
      });
    } finally {
      setIsLoadingActions(false);
    }
  }

  async function editItem(
    actionConnector: ActionConnector,
    tab: EditConnectorTabs,
    isFix?: boolean
  ) {
    setEditConnectorProps({ initialConnector: actionConnector, tab, isFix: isFix ?? false });
  }

  const actionsTableColumns = [
    {
      field: 'name',
      'data-test-subj': 'connectorsTableCell-name',
      name: i18n.translate(
        'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.nameTitle',
        {
          defaultMessage: 'Name',
        }
      ),
      sortable: false,
      truncateText: true,
      render: (value: string, item: ActionConnectorTableItem) => {
        const checkEnabledResult = checkActionTypeEnabled(
          actionTypesIndex && actionTypesIndex[item.actionTypeId]
        );

        /**
         * TODO: Remove when connectors can provide their own UX message.
         * Issue: https://github.com/elastic/kibana/issues/114507
         */
        const showDeprecatedTooltip = item.isDeprecated;
        const name = getConnectorName(value, item);

        const link = (
          <>
            <EuiLink
              data-test-subj={`edit${item.id}`}
              onClick={() => editItem(item, EditConnectorTabs.Configuration)}
              key={item.id}
              disabled={actionTypesIndex ? !actionTypesIndex[item.actionTypeId]?.enabled : true}
            >
              {name}
            </EuiLink>
            {item.isMissingSecrets ? (
              <EuiIconTip
                iconProps={{ 'data-test-subj': `missingSecrets_${item.id}` }}
                type="alert"
                color="warning"
                content={i18n.translate(
                  'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.missingSecretsDescription',
                  { defaultMessage: 'Sensitive information was not imported' }
                )}
                position="right"
              />
            ) : null}
            {showDeprecatedTooltip && <ConnectorIconTipWithSpacing />}
          </>
        );

        return checkEnabledResult.isEnabled ? (
          link
        ) : (
          <>
            {link}
            <EuiIconTip
              type="questionInCircle"
              content={checkEnabledResult.message}
              position="right"
            />
          </>
        );
      },
    },
    {
      field: 'actionType',
      'data-test-subj': 'connectorsTableCell-actionType',
      name: i18n.translate(
        'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actionTypeTitle',
        {
          defaultMessage: 'Type',
        }
      ),
      sortable: false,
      truncateText: true,
    },
    {
      field: 'compatibility',
      'data-test-subj': 'connectorsTableCell-compatibility',
      name: i18n.translate(
        'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.compatibility',
        {
          defaultMessage: 'Compatibility',
        }
      ),
      sortable: false,
      truncateText: true,
      render: (compatibility: string[]) => {
        return (
          <EuiFlexGroup
            wrap
            responsive={false}
            gutterSize="xs"
            data-test-subj="compatibility-content"
          >
            {compatibility.map((compatibilityItem: string) => (
              <EuiFlexItem grow={false} key={compatibilityItem}>
                <EuiBadge data-test-subj="connectorsTableCell-compatibility-badge" color="default">
                  {compatibilityItem}
                </EuiBadge>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        );
      },
    },
    {
      name: '',
      render: (item: ActionConnectorTableItem) => {
        return (
          <EuiFlexGroup justifyContent="flexEnd" alignItems="flexEnd">
            <DeleteOperation canDelete={canDelete} item={item} onDelete={() => onDelete([item])} />
            {item.isMissingSecrets ? (
              <>
                {actionTypesIndex && actionTypesIndex[item.actionTypeId]?.enabled ? (
                  <EuiFlexItem grow={false} style={{ marginLeft: 4 }}>
                    <EuiToolTip
                      content={i18n.translate(
                        'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.fixActionDescription',
                        { defaultMessage: 'Fix connector configuration' }
                      )}
                    >
                      <EuiButtonEmpty
                        size="xs"
                        data-test-subj="fixConnectorButton"
                        onClick={() => editItem(item, EditConnectorTabs.Configuration, true)}
                      >
                        {i18n.translate(
                          'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.fixButtonLabel',
                          {
                            defaultMessage: 'Fix',
                          }
                        )}
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  </EuiFlexItem>
                ) : null}
              </>
            ) : (
              <RunOperation
                canExecute={canExecute && actionTypesIndex && actionTypesIndex[item.actionTypeId]}
                item={item}
                onRun={() => editItem(item, EditConnectorTabs.Test)}
              />
            )}
          </EuiFlexGroup>
        );
      },
    },
  ];

  const table = (
    <EuiInMemoryTable
      loading={isLoadingActions || isLoadingActionTypes}
      items={actionConnectorTableItems}
      sorting={true}
      itemId="id"
      columns={actionsTableColumns}
      rowProps={(item: ActionConnectorTableItem) => ({
        className:
          !actionTypesIndex || !actionTypesIndex[item.actionTypeId]?.enabled
            ? 'actConnectorsList__tableRowDisabled'
            : '',
        'data-test-subj': 'connectors-row',
      })}
      cellProps={(item: ActionConnectorTableItem) => ({
        'data-test-subj': 'cell',
        className:
          !actionTypesIndex || !actionTypesIndex[item.actionTypeId]?.enabled
            ? 'actConnectorsList__tableCellDisabled'
            : '',
      })}
      data-test-subj="actionsTable"
      pagination={{
        initialPageIndex: 0,
        pageIndex,
      }}
      onTableChange={({ page }: Criteria<ActionConnectorTableItem>) => {
        if (page) {
          setPageIndex(page.index);
        }
      }}
      selection={
        canDelete
          ? {
              onSelectionChange(updatedSelectedItemsList: ActionConnectorTableItem[]) {
                setSelectedItems(updatedSelectedItemsList);
              },
              selectable: ({ isPreconfigured }: ActionConnectorTableItem) => !isPreconfigured,
            }
          : undefined
      }
      search={{
        filters: [
          {
            type: 'field_value_selection',
            field: 'actionTypeId',
            name: i18n.translate(
              'xpack.triggersActionsUI.sections.actionsConnectorsList.filters.actionTypeIdName',
              { defaultMessage: 'Type' }
            ),
            multiSelect: 'or',
            options: actionTypesList,
          },
        ],
        toolsLeft: (selectedItems.length === 0 || !canDelete
          ? []
          : [
              <EuiButton
                key="delete"
                iconType="trash"
                color="danger"
                data-test-subj="bulkDelete"
                onClick={() => onDelete(selectedItems)}
                title={
                  canDelete
                    ? undefined
                    : i18n.translate(
                        'xpack.triggersActionsUI.sections.actionsConnectorsList.buttons.deleteDisabledTitle',
                        { defaultMessage: 'Unable to delete connectors' }
                      )
                }
              >
                <FormattedMessage
                  id="xpack.triggersActionsUI.sections.actionsConnectorsList.buttons.deleteLabel"
                  defaultMessage="Delete {count}"
                  values={{
                    count: selectedItems.length,
                  }}
                />
              </EuiButton>,
            ]
        ).concat(
          canSave
            ? [
                <EuiButton
                  data-test-subj="createActionButton"
                  key="create-action"
                  fill
                  onClick={() => setAddFlyoutVisibility(true)}
                >
                  <FormattedMessage
                    id="xpack.triggersActionsUI.sections.actionsConnectorsList.addActionButtonLabel"
                    defaultMessage="Create connector"
                  />
                </EuiButton>,
              ]
            : []
        ),
      }}
    />
  );

  return (
    <>
      <EuiPageTemplate.Section
        paddingSize="none"
        data-test-subj="actionsList"
        alignment={actionConnectorTableItems.length === 0 ? 'center' : 'top'}
      >
        <DeleteModalConfirmation
          data-test-subj="deleteConnectorsConfirmation"
          onDeleted={(deleted: string[]) => {
            if (selectedItems.length === 0 || selectedItems.length === deleted.length) {
              const updatedActions = actions.filter(
                (action) => action.id && !connectorsToDelete.includes(action.id)
              );
              setActions(updatedActions);
              setSelectedItems([]);
            }
            setConnectorsToDelete([]);
          }}
          onErrors={async () => {
            // Refresh the actions from the server, some actions may have beend deleted
            await loadActions();
            setConnectorsToDelete([]);
          }}
          onCancel={async () => {
            setConnectorsToDelete([]);
          }}
          apiDeleteCall={deleteActions}
          idsToDelete={connectorsToDelete}
          singleTitle={i18n.translate(
            'xpack.triggersActionsUI.sections.actionsConnectorsList.singleTitle',
            { defaultMessage: 'connector' }
          )}
          multipleTitle={i18n.translate(
            'xpack.triggersActionsUI.sections.actionsConnectorsList.multipleTitle',
            { defaultMessage: 'connectors' }
          )}
          showWarningText={showWarningText}
          warningText={i18n.translate(
            'xpack.triggersActionsUI.sections.actionsConnectorsList.warningText',
            {
              defaultMessage:
                '{connectors, plural, one {This connector is} other {Some connectors are}} currently in use.',
              values: {
                connectors: connectorsToDelete.length,
              },
            }
          )}
          setIsLoadingState={(isLoading: boolean) => setIsLoadingActionTypes(isLoading)}
        />

        {/* Render the view based on if there's data or if they can save */}
        {(isLoadingActions || isLoadingActionTypes) && <CenterJustifiedSpinner />}
        {actionConnectorTableItems.length !== 0 && table}
        {actionConnectorTableItems.length === 0 &&
          canSave &&
          !isLoadingActions &&
          !isLoadingActionTypes && (
            <EmptyConnectorsPrompt
              onCTAClicked={() => setAddFlyoutVisibility(true)}
              docLinks={docLinks}
            />
          )}
        {actionConnectorTableItems.length === 0 && !canSave && <NoPermissionPrompt />}
        {addFlyoutVisible ? (
          <CreateConnectorFlyout
            onClose={() => {
              setAddFlyoutVisibility(false);
            }}
            onTestConnector={(connector) => editItem(connector, EditConnectorTabs.Test)}
            onConnectorCreated={loadActions}
            actionTypeRegistry={actionTypeRegistry}
          />
        ) : null}
        {editConnectorProps.initialConnector ? (
          <EditConnectorFlyout
            key={`${editConnectorProps.initialConnector.id}${
              editConnectorProps.tab ? `:${editConnectorProps.tab}` : ``
            }`}
            connector={editConnectorProps.initialConnector}
            tab={editConnectorProps.tab}
            onClose={() => {
              setEditConnectorProps(omit(editConnectorProps, 'initialConnector'));
            }}
            onConnectorUpdated={(connector) => {
              setEditConnectorProps({ ...editConnectorProps, initialConnector: connector });
              loadActions();
            }}
            actionTypeRegistry={actionTypeRegistry}
          />
        ) : null}
      </EuiPageTemplate.Section>
    </>
  );
};

// eslint-disable-next-line import/no-default-export
export { ActionsConnectorsList as default };

function getActionsCountByActionType(actions: ActionConnector[], actionTypeId: string) {
  return actions.filter((action) => action.actionTypeId === actionTypeId).length;
}

function getConnectorName(name: string, connector: ActionConnector): string {
  return connector.isDeprecated ? `${name} ${deprecatedMessage}` : name;
}

const DeleteOperation: React.FunctionComponent<{
  item: ActionConnectorTableItem;
  canDelete: boolean;
  onDelete: () => void;
}> = ({ item, canDelete, onDelete }) => {
  if (item.isPreconfigured) {
    return (
      <EuiFlexItem grow={false}>
        <EuiBetaBadge
          data-test-subj="preConfiguredTitleMessage"
          label={i18n.translate(
            'xpack.triggersActionsUI.sections.actionsConnectorsList.preconfiguredTitleMessage',
            {
              defaultMessage: 'Preconfigured',
            }
          )}
          tooltipContent="This connector can't be deleted."
        />
      </EuiFlexItem>
    );
  }
  return (
    <EuiFlexItem grow={false}>
      <EuiToolTip
        content={
          canDelete
            ? i18n.translate(
                'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.deleteActionDescription',
                { defaultMessage: 'Delete this connector' }
              )
            : i18n.translate(
                'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.deleteActionDisabledDescription',
                { defaultMessage: 'Unable to delete connectors' }
              )
        }
      >
        <EuiButtonIcon
          isDisabled={!canDelete}
          data-test-subj="deleteConnector"
          aria-label={i18n.translate(
            'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.deleteActionName',
            { defaultMessage: 'Delete' }
          )}
          onClick={onDelete}
          iconType={'trash'}
        />
      </EuiToolTip>
    </EuiFlexItem>
  );
};

const RunOperation: React.FunctionComponent<{
  item: ActionConnectorTableItem;
  canExecute: boolean;
  onRun: () => void;
}> = ({ item, canExecute, onRun }) => {
  return (
    <EuiFlexItem grow={false}>
      <EuiToolTip
        content={
          canExecute
            ? i18n.translate(
                'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.runConnectorDescription',
                { defaultMessage: 'Run this connector' }
              )
            : i18n.translate(
                'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.runConnectorDisabledDescription',
                { defaultMessage: 'Unable to run connectors' }
              )
        }
      >
        <EuiButtonIcon
          isDisabled={!canExecute}
          data-test-subj="runConnector"
          aria-label={i18n.translate(
            'xpack.triggersActionsUI.sections.actionsConnectorsList.connectorsListTable.columns.actions.runConnectorName',
            { defaultMessage: 'Run' }
          )}
          onClick={onRun}
          iconType={'play'}
        />
      </EuiToolTip>
    </EuiFlexItem>
  );
};

const NoPermissionPrompt: React.FunctionComponent<{}> = () => (
  <EuiEmptyPrompt
    iconType="securityApp"
    title={
      <h1>
        <FormattedMessage
          id="xpack.triggersActionsUI.sections.actionsConnectorsList.noPermissionToCreateTitle"
          defaultMessage="No permissions to create connectors"
        />
      </h1>
    }
    body={
      <p data-test-subj="permissionDeniedMessage">
        <FormattedMessage
          id="xpack.triggersActionsUI.sections.actionsConnectorsList.noPermissionToCreateDescription"
          defaultMessage="Contact your system administrator."
        />
      </p>
    }
  />
);
