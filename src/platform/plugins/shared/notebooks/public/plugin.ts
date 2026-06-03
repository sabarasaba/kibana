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
import { CONSOLE_LANG_ID, monaco } from '@kbn/monaco';
import type {
  NotebooksPluginSetup,
  NotebooksPluginStart,
  NotebooksSetupDeps,
  EsAutocompleteFacade,
} from './types';

export class NotebooksPlugin implements Plugin<NotebooksPluginSetup, NotebooksPluginStart> {
  private esAutocompleteFacade: EsAutocompleteFacade | undefined;

  public setup(
    core: CoreSetup,
    { devTools, console: consoleDeps }: NotebooksSetupDeps
  ): NotebooksPluginSetup {
    if (consoleDeps?.getEsAutocompleteFacade) {
      const facade = consoleDeps.getEsAutocompleteFacade();
      this.esAutocompleteFacade = facade;
      monaco.languages.registerCompletionItemProvider(CONSOLE_LANG_ID, facade.requestCellProvider);
    }

    devTools.register({
      id: 'notebooks',
      order: 2,
      title: i18n.translate('notebooks.displayName', { defaultMessage: 'Notebooks' }),
      enableRouting: false,
      mount: async ({ element }) => {
        const [coreStart] = await core.getStartServices();
        const { renderApp } = await import('./application');
        return renderApp(coreStart, element, this.esAutocompleteFacade);
      },
    });

    return {};
  }

  public start(_core: CoreStart): NotebooksPluginStart {
    return {};
  }
}
