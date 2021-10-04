/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useState, useEffect } from 'react';

import { SystemIndicesFlyout, SystemIndicesFlyoutProps } from './flyout';
import { useAppContext } from '../../../app_context';
import type { ResponseError } from '../../../lib/api';
import { GlobalFlyout } from '../../../../shared_imports';

const FLYOUT_ID = 'upgradeSystemIndicesFlyout';
const { useGlobalFlyout } = GlobalFlyout;

export const useSystemIndicesUpgrade = () => {
  const {
    services: { api },
  } = useAppContext();

  const [showFlyout, setShowFlyout] = useState(false);

  const [startUpgradeStatus, setStartUpgradeStatus] = useState<{
    statusType: string;
    details?: ResponseError;
  }>({ statusType: 'idle' });

  const { data, error, isLoading, resendRequest, isInitialRequest } =
    api.useLoadSystemIndicesUpgradeStatus();

  const { addContent: addContentToGlobalFlyout, removeContent: removeContentFromGlobalFlyout } =
    useGlobalFlyout();

  const closeFlyout = useCallback(() => {
    setShowFlyout(false);
    removeContentFromGlobalFlyout(FLYOUT_ID);
  }, [removeContentFromGlobalFlyout]);

  useEffect(() => {
    if (showFlyout) {
      addContentToGlobalFlyout<SystemIndicesFlyoutProps>({
        id: FLYOUT_ID,
        Component: SystemIndicesFlyout,
        props: {
          data: data!,
          closeFlyout,
        },
        flyoutProps: {
          onClose: closeFlyout,
        },
      });
    }
  }, [addContentToGlobalFlyout, data, showFlyout, closeFlyout]);

  const beginSystemIndicesUpgrade = useCallback(async () => {
    const { error: startUpgradeError } = await api.upgradeSystemIndices();

    setStartUpgradeStatus({
      statusType: startUpgradeError ? 'error' : 'started',
      details: startUpgradeError ?? undefined,
    });

    if (!startUpgradeError) {
      resendRequest();
    }
  }, [api, resendRequest]);

  return {
    setShowFlyout,
    startUpgradeStatus,
    beginSystemIndicesUpgrade,
    upgradeStatus: {
      data,
      error,
      isLoading,
      resendRequest,
      isInitialRequest,
    },
  };
};
