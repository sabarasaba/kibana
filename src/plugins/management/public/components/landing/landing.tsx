/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useEffect } from 'react';
import { DefaultLandingPage } from './default';
import { ServerlessLandingPage } from './serverless';
import { ManagementSection } from '../../utils';

interface ManagementLandingPageProps {
  version: string;
  onAppMounted: (id: string) => void;
  setBreadcrumbs: () => void;
  sections: ManagementSection[];
}

export const ManagementLandingPage = ({
  version,
  sections,
  setBreadcrumbs,
  onAppMounted,
}: ManagementLandingPageProps) => {
  const isServerless = true;
  setBreadcrumbs();

  useEffect(() => {
    onAppMounted('');
  }, [onAppMounted]);

  if (isServerless) {
    return <ServerlessLandingPage sections={sections} />;
  }

  return <DefaultLandingPage version={version} />;
};
