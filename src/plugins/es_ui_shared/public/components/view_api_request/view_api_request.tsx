/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useCallback } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { compressToEncodedURIComponent } from 'lz-string';

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiButtonEmpty,
  EuiText,
  EuiSpacer,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCopy,
} from '@elastic/eui';
import { ApplicationStart, Capabilities } from 'src/core/public';
import type { UrlService } from 'src/plugins/share/common/url_service';

interface Props {
  title: string;
  description: string;
  request: string;
  closeFlyout: () => void;
  navigateToUrl: ApplicationStart['navigateToUrl'];
  urlService?: UrlService;
  capabilities?: Capabilities;
}

export const ViewApiRequest: React.FunctionComponent<Props> = ({
  title,
  description,
  request,
  closeFlyout,
  navigateToUrl,
  urlService,
  capabilities,
}) => {
  let consoleLink: string | undefined;

  if (urlService) {
    const devToolsDataUri = compressToEncodedURIComponent(request);
    consoleLink = urlService.locators
      .get('CONSOLE_APP_LOCATOR')
      ?.useUrl({ loadFrom: `data:text/plain,${devToolsDataUri}` });
  }
  // Check if both the Dev Tools UI and the Console UI are enabled.
  const shouldShowDevToolsLink = capabilities?.dev_tools.show && consoleLink !== undefined;
  const consolePreviewClick = useCallback(
    () => consoleLink && navigateToUrl && navigateToUrl(consoleLink),
    [consoleLink, navigateToUrl]
  );

  return (
    <EuiFlyout maxWidth={480} onClose={closeFlyout}>
      <EuiFlyoutHeader>
        <EuiTitle>
          <h2 data-test-subj="apiRequestFlyoutTitle">{title}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiText>
          <p data-test-subj="apiRequestFlyoutDescription">{description}</p>
        </EuiText>
        <EuiSpacer />

        <EuiFlexGroup
          direction="column"
          gutterSize="s"
          wrap={false}
          responsive={false}
          className="insRequestCodeViewer"
        >
          <EuiFlexItem grow={false}>
            <EuiSpacer size="s" />
            <div className="eui-textRight">
              <EuiCopy textToCopy={request}>
                {(copy) => (
                  <EuiButtonEmpty
                    size="xs"
                    flush="right"
                    iconType="copyClipboard"
                    onClick={copy}
                    data-test-subj="apiRequestFlyoutCopyClipboardButton"
                  >
                    <FormattedMessage
                      id="esUi.viewApiRequest.copyToClipboardButton"
                      defaultMessage="Copy to clipboard"
                    />
                  </EuiButtonEmpty>
                )}
              </EuiCopy>
              {shouldShowDevToolsLink && (
                <EuiButtonEmpty
                  size="xs"
                  flush="right"
                  iconType="wrench"
                  href={consoleLink}
                  onClick={consolePreviewClick}
                  data-test-subj="apiRequestFlyoutOpenInConsoleButton"
                >
                  <FormattedMessage
                    id="esUi.viewApiRequest.openInConsoleButton"
                    defaultMessage="Open in Console"
                  />
                </EuiButtonEmpty>
              )}
            </div>
          </EuiFlexItem>
          <EuiFlexItem grow={true}>
            <EuiCodeBlock language="json" data-test-subj="apiRequestFlyoutBody">
              {request}
            </EuiCodeBlock>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiButtonEmpty
          iconType="cross"
          onClick={closeFlyout}
          flush="left"
          data-test-subj="apiRequestFlyoutClose"
        >
          <FormattedMessage id="esUi.viewApiRequest.closeButtonLabel" defaultMessage="Close" />
        </EuiButtonEmpty>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
