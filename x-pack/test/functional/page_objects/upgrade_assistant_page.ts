/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrService } from '../ftr_provider_context';

export class UpgradeAssistantPageObject extends FtrService {
  private readonly retry = this.ctx.getService('retry');
  private readonly log = this.ctx.getService('log');
  private readonly browser = this.ctx.getService('browser');
  private readonly testSubjects = this.ctx.getService('testSubjects');
  private readonly common = this.ctx.getPageObject('common');

  async initTests() {
    this.log.debug('UpgradeAssistant:initTests');
  }

  async navigateToPage() {
    return await this.retry.try(async () => {
      await this.common.navigateToApp('settings');
      await this.testSubjects.click('upgrade_assistant');
      await this.retry.waitFor('url to contain /upgrade_assistant', async () => {
        const url = await this.browser.getCurrentUrl();
        return url.includes('/upgrade_assistant');
      });
    });
  }

  async clickEsDeprecationsPanel() {
    return await this.retry.try(async () => {
      await this.testSubjects.click('esStatsPanel');
    });
  }

  async clickKibanaDeprecationsPanel() {
    return await this.retry.try(async () => {
      await this.testSubjects.click('kibanaStatsPanel');
    });
  }
}
