/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import type { Plugin, CoreSetup, CoreStart } from '@kbn/core/public';
import type { NotebooksPluginSetup, NotebooksPluginStart, NotebooksSetupDeps } from './types';

export class NotebooksPlugin implements Plugin<NotebooksPluginSetup, NotebooksPluginStart> {
  public setup(core: CoreSetup, { devTools }: NotebooksSetupDeps): NotebooksPluginSetup {
    devTools.register({
      id: 'notebooks',
      order: 2,
      title: i18n.translate('notebooks.displayName', { defaultMessage: 'Notebooks' }),
      enableRouting: false,
      mount: async ({ element }) => {
        const [coreStart] = await core.getStartServices();
        const { renderApp } = await import('./application');
        return renderApp(coreStart, element);
      },
    });

    return {};
  }

  public start(_core: CoreStart): NotebooksPluginStart {
    return {};
  }
}
