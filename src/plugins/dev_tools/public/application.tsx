/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { EuiTab, EuiTabs, EuiToolTip, EuiBetaBadge, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { I18nProvider } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';
import { euiThemeVars } from '@kbn/ui-shared-deps-src/theme';

import { ApplicationStart, ChromeStart, ScopedHistory } from 'src/core/public';
import { docTitleService, breadcrumbService } from './services';

import { DevToolApp } from './dev_tool';

interface DevToolsWrapperProps {
  devTools: readonly DevToolApp[];
  activeDevTool: DevToolApp;
  updateRoute: (newRoute: string) => void;
}

interface MountedDevToolDescriptor {
  devTool: DevToolApp;
  mountpoint: HTMLElement;
  unmountHandler: () => void;
}

function DevToolsWrapper({ devTools, activeDevTool, updateRoute }: DevToolsWrapperProps) {
  const mountedTool = useRef<MountedDevToolDescriptor | null>(null);

  useEffect(
    () => () => {
      if (mountedTool.current) {
        mountedTool.current.unmountHandler();
      }
    },
    []
  );

  useEffect(() => {
    docTitleService.setTitle(activeDevTool.title);
    breadcrumbService.setBreadcrumbs(activeDevTool.title);
  }, [activeDevTool]);

  return (
    <main className="devApp">
      <EuiTabs style={{ paddingLeft: euiThemeVars.euiSizeS }} size="l">
        {devTools.map((currentDevTool) => (
          <EuiTab
            key={currentDevTool.id}
            disabled={currentDevTool.isDisabled()}
            isSelected={currentDevTool === activeDevTool}
            onClick={() => {
              if (!currentDevTool.isDisabled()) {
                updateRoute(`/${currentDevTool.id}`);
              }
            }}
          >
            <EuiToolTip content={currentDevTool.tooltipContent}>
              <span>
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>{currentDevTool.title}</EuiFlexItem>

                  {currentDevTool.isBeta && (
                    <EuiFlexItem grow={false}>
                      <EuiBetaBadge
                        label={i18n.translate('devTools.devToolBetaLabel', {
                          defaultMessage: 'Beta',
                        })}
                        tooltipContent={i18n.translate('xpack.devToolBetaTooltipText', {
                          defaultMessage:
                            'This feature might change drastically in future releases',
                        })}
                      />
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </span>
            </EuiToolTip>
          </EuiTab>
        ))}
      </EuiTabs>
      <div
        className="devApp__container"
        role="tabpanel"
        data-test-subj={activeDevTool.id}
        ref={async (element) => {
          if (
            element &&
            (mountedTool.current === null ||
              mountedTool.current.devTool !== activeDevTool ||
              mountedTool.current.mountpoint !== element)
          ) {
            if (mountedTool.current) {
              mountedTool.current.unmountHandler();
            }

            const params = {
              element,
              appBasePath: '',
              onAppLeave: () => undefined,
              setHeaderActionMenu: () => undefined,
              // TODO: adapt to use Core's ScopedHistory
              history: {} as any,
            };

            const unmountHandler = await activeDevTool.mount(params);

            mountedTool.current = {
              devTool: activeDevTool,
              mountpoint: element,
              unmountHandler,
            };
          }
        }}
      />
    </main>
  );
}

function redirectOnMissingCapabilities(application: ApplicationStart) {
  if (!application.capabilities.dev_tools.show) {
    application.navigateToApp('home');
    return true;
  }
  return false;
}

function setBadge(application: ApplicationStart, chrome: ChromeStart) {
  if (application.capabilities.dev_tools.save) {
    return;
  }

  chrome.setBadge({
    text: i18n.translate('devTools.badge.readOnly.text', {
      defaultMessage: 'Read only',
    }),
    tooltip: i18n.translate('devTools.badge.readOnly.tooltip', {
      defaultMessage: 'Unable to save',
    }),
    iconType: 'glasses',
  });
}

export function renderApp(
  element: HTMLElement,
  application: ApplicationStart,
  chrome: ChromeStart,
  history: ScopedHistory,
  devTools: readonly DevToolApp[]
) {
  if (redirectOnMissingCapabilities(application)) {
    return () => {};
  }

  setBadge(application, chrome);
  docTitleService.setup(chrome.docTitle.change);
  breadcrumbService.setup(chrome.setBreadcrumbs);

  ReactDOM.render(
    <I18nProvider>
      <Router>
        <Switch>
          {devTools
            // Only create routes for devtools that are not disabled
            .filter((devTool) => !devTool.isDisabled())
            .map((devTool) => (
              <Route
                key={devTool.id}
                path={`/${devTool.id}`}
                exact={!devTool.enableRouting}
                render={(props) => (
                  <DevToolsWrapper
                    updateRoute={props.history.push}
                    activeDevTool={devTool}
                    devTools={devTools}
                  />
                )}
              />
            ))}
          <Route path="/">
            <Redirect to={`/${devTools[0].id}`} />
          </Route>
        </Switch>
      </Router>
    </I18nProvider>,
    element
  );

  // dispatch synthetic hash change event to update hash history objects
  // this is necessary because hash updates triggered by using popState won't trigger this event naturally.
  const unlisten = history.listen(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(element);
    unlisten();
  };
}
