/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiPageBody,
  EuiPageContentBody_Deprecated as EuiPageContentBody,
  EuiStepsHorizontal,
  EuiSpacer,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiCallOut,
  EuiButton,
} from '@elastic/eui';

import { extractQueryParams } from '../../../shared_imports';
import { getRouter, redirect } from '../../services';
import { setBreadcrumbs } from '../../services/breadcrumb';
import { RemoteClusterPageTitle, RemoteClusterForm } from '../components';

const CREATE_CONNECTION = 0;
const AUTH_METHOD = 1;

export class RemoteClusterAdd extends PureComponent {
  static propTypes = {
    addCluster: PropTypes.func,
    isAddingCluster: PropTypes.bool,
    addClusterError: PropTypes.object,
    clearAddClusterErrors: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      currentStep: AUTH_METHOD,
    };
  }

  componentDidMount() {
    setBreadcrumbs('add');
  }

  componentWillUnmount() {
    // Clean up after ourselves.
    this.props.clearAddClusterErrors();
  }

  getStepDefinitions = () => {
    const { currentStep } = this.state

    return [
      {
        step: CREATE_CONNECTION,
        title: i18n.translate('xpack.remoteClusters.clusterWizard.createConnectionLabel', {
          defaultMessage: 'Create Connection',
        }),
        status: currentStep === CREATE_CONNECTION ? 'current' : 'complete',
        onClick: () => {},
      },
      {
        step: AUTH_METHOD,
        title: i18n.translate('xpack.remoteClusters.clusterWizard.authMethodLabel', {
          defaultMessage: 'Authentication method',
        }),
        status: currentStep === AUTH_METHOD ? 'current' : 'incomplete',
        onClick: () => {},
      },
    ]
  }

  save = (clusterConfig) => {
    this.setState({ currentStep: 1 })
    // this.props.addCluster(clusterConfig);
  };

  cancel = () => {
    const {
      history,
      route: {
        location: { search },
      },
    } = getRouter();
    const { redirect: redirectUrl } = extractQueryParams(search);

    if (redirectUrl) {
      const decodedRedirect = decodeURIComponent(redirectUrl);
      redirect(decodedRedirect);
    } else {
      history.push('/list');
    }
  };

  render() {
    const { isAddingCluster, addClusterError } = this.props;
    const { currentStep } = this.state;

    return (
      <EuiPageBody restrictWidth={true} data-test-subj="add-remote-cluster">
        <EuiPageContentBody color="transparent" paddingSize="none">
          <RemoteClusterPageTitle
            title={
              <FormattedMessage
                id="xpack.remoteClusters.addTitle"
                defaultMessage="Add remote cluster"
              />
            }
            description={
              <FormattedMessage
                id="xpack.remoteClusters.remoteClustersDescription"
                defaultMessage="Add a remote cluster that connects to seed nodes or to a single proxy address."
              />
            }
          />

          <EuiStepsHorizontal steps={this.getStepDefinitions()} />
          <EuiSpacer size="m" />

          {currentStep === CREATE_CONNECTION && (
            <RemoteClusterForm
              isSaving={isAddingCluster}
              saveError={addClusterError}
              save={this.save}
              cancel={this.cancel}
            />
          )}

          {currentStep === AUTH_METHOD && (
            <>
              <EuiText grow={false} size="s">
                <p>Your cluster has now been created and its time to configure its authentication method.</p>
              </EuiText>
              <EuiSpacer size="xxl" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    title="With API keys"
                    betaBadgeProps={{ label: 'Recommended', color: 'accent' }}
                  >
                    <EuiCallOut color="warning" iconType="warning">
                      <p>
                        Remote clusters configured to use API key authentication will not work with CCR.
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                      </p>
                    </EuiCallOut>
                    <EuiSpacer size="l" />

                    <EuiText grow={false} size="s">
                      <p>This is the preffered way of setting up authentication for connecting to Remote Clusters. This is more secure, flexible and powerful than the certificates based one.</p>
                    </EuiText>

                    <EuiFlexGroup justifyContent="flexEnd">
                      <EuiFlexItem grow={false}>
                        <EuiButton>Documentation</EuiButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiCard>
                </EuiFlexItem>

                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    title="With certificates"
                  >
                    <EuiText grow={false} size="s">
                      <p>This is our easier to setup method, but less secure than the API key based approach.</p>
                    </EuiText>
                    <EuiFlexGroup justifyContent="flexEnd">
                      <EuiFlexItem grow={false}>
                        <EuiButton>Documentation</EuiButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiCard>
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          )}
        </EuiPageContentBody>
      </EuiPageBody>
    );
  }
}
