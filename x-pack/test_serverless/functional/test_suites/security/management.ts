/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getPageObject, getService }: FtrProviderContext) {
  const PageObject = getPageObject('common');

  describe('Management', function () {
    it('redirects from common management url to security specific page', async () => {
      await PageObject.navigateToUrl('management', {
        ensureCurrentUrl: false,
        shouldLoginIfPrompted: false,
        shouldUseHashForSubUrl: false,
      });

      await PageObject.waitUntilUrlIncludes('/security/manage');
    });
  });
}
