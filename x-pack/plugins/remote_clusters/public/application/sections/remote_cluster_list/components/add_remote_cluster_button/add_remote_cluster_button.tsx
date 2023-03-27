/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';

import {
  EuiButton,
  EuiButtonIcon,
  EuiPopover,
  useGeneratedHtmlId,
  EuiContextMenuItem,
  EuiContextMenuPanel,
} from '@elastic/eui';
import { ScopedHistory } from '@kbn/core/public';
import { reactRouterNavigate } from '@kbn/kibana-react-plugin/public';

interface Props {
  history: ScopedHistory;
}

export function AddRemoteClusterButton({ history }: Props): JSX.Element {
  const [isPopoverOpen, setPopover] = useState(false);
  const customContextMenuPopoverId = useGeneratedHtmlId({
    prefix: 'customContextMenuPopover',
  });

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const openPopoverButton = (
    <EuiButtonIcon
      style={{ marginLeft: '.5rem' }}
      size="m"
      display="fill"
      iconType="arrowDown"
      onClick={onButtonClick}
    />
  )

  return (
    <>
      <EuiButton
        {...reactRouterNavigate(history, '/add')}
        fill
        iconType="plusInCircle"
        data-test-subj="remoteClusterCreateButton"
      >
        <FormattedMessage
          id="xpack.remoteClusters.remoteClusterList.connectButtonLabel"
          defaultMessage="Add a remote cluster"
        />
      </EuiButton>
      <EuiPopover
        id={customContextMenuPopoverId}
        button={openPopoverButton}
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <EuiContextMenuPanel>
          <EuiContextMenuItem key="item-1" icon="indexOpen" size="s" {...reactRouterNavigate(history, '/add')}>
            Create using old model
          </EuiContextMenuItem>
        </EuiContextMenuPanel>
      </EuiPopover>
    </>
  );
}
