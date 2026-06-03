/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import type { Plugin, CoreSetup, CoreStart, PluginInitializerContext, HttpSetup } from '@kbn/core/public';
import { ENABLE_PERSISTENT_CONSOLE_UI_SETTING_ID } from '@kbn/dev-tools-plugin/public';
import { monaco, CONSOLE_LANG_ID } from '@kbn/monaco';

import { EmbeddableConsole } from './application/containers/embeddable';
import type {
  AppSetupUIPluginDependencies,
  AppStartUIPluginDependencies,
  ClientConfigType,
  ConsolePluginSetup,
  ConsolePluginStart,
  ConsoleUILocatorParams,
  EmbeddedConsoleView,
  AppPluginSetupDependencies,
} from './types';
import {
  AutocompleteInfo,
  setAutocompleteInfo,
  EmbeddableConsoleInfo,
  createStorage,
  setStorage,
  httpService,
} from './services';

export class ConsoleUIPlugin
  implements
    Plugin<
      ConsolePluginSetup,
      ConsolePluginStart,
      AppSetupUIPluginDependencies,
      AppPluginSetupDependencies
    >
{
  private readonly autocompleteInfo = new AutocompleteInfo();
  private _embeddableConsole: EmbeddableConsoleInfo;

  constructor(private ctx: PluginInitializerContext) {
    const storage = createStorage({
      engine: window.localStorage,
      prefix: 'sense:',
    });
    setStorage(storage);
    this._embeddableConsole = new EmbeddableConsoleInfo(storage);
  }

  public setup(
    { notifications, getStartServices, http }: CoreSetup<AppPluginSetupDependencies>,
    { devTools, home, share, usageCollection }: AppSetupUIPluginDependencies
  ): ConsolePluginSetup {
    const {
      ui: { enabled: isConsoleUiEnabled },
    } = this.ctx.config.get<ClientConfigType>();

    httpService.setup(http);
    this.autocompleteInfo.setup(http);
    setAutocompleteInfo(this.autocompleteInfo);

    if (isConsoleUiEnabled) {
      if (home) {
        home.featureCatalogue.register({
          id: 'console',
          title: i18n.translate('console.devToolsTitle', {
            defaultMessage: 'Interact with the Elasticsearch API',
          }),
          description: i18n.translate('console.devToolsDescription', {
            defaultMessage: 'Skip cURL and use a JSON interface to work with your data in Console.',
          }),
          icon: 'consoleApp',
          path: '/app/dev_tools#/console',
          showOnHomePage: false,
          category: 'admin',
        });
      }

      devTools.register({
        id: 'console',
        order: 1,
        title: i18n.translate('console.consoleDisplayName', {
          defaultMessage: 'Console',
        }),
        enableRouting: true,
        mount: async ({ element, history }) => {
          const [core, deps] = await getStartServices();

          const {
            docLinks: { DOC_LINK_VERSION, links },
            application,
            ...startServices
          } = core;
          const { data, licensing } = deps;

          const { renderApp } = await import('./application');

          return renderApp({
            ...startServices,
            http,
            docLinkVersion: DOC_LINK_VERSION,
            docLinks: links,
            application,
            data,
            licensing,
            notifications,
            usageCollection,
            element,
            history,
            autocompleteInfo: this.autocompleteInfo,
            isDevMode: this.ctx.env.mode.dev,
          });
        },
      });

      const locator = share.url.locators.create<ConsoleUILocatorParams>({
        id: 'CONSOLE_APP_LOCATOR',
        getLocation: async ({ loadFrom }) => {
          return {
            app: 'dev_tools',
            path: `#/console${loadFrom ? `?load_from=${loadFrom}` : ''}`,
            state: { loadFrom },
          };
        },
      });

      return { locator, getEsAutocompleteFacade: () => createEsAutocompleteFacade(http) };
    }

    return { getEsAutocompleteFacade: () => createEsAutocompleteFacade(http) };
  }

  public start(core: CoreStart, deps: AppStartUIPluginDependencies): ConsolePluginStart {
    const {
      ui: { enabled: isConsoleUiEnabled, embeddedEnabled: isEmbeddedConsoleEnabled },
    } = this.ctx.config.get<ClientConfigType>();
    const isDevMode = this.ctx.env.mode.dev;

    const consoleStart: ConsolePluginStart = {};
    const embeddedConsoleUiSetting = core.uiSettings.get<boolean>(
      ENABLE_PERSISTENT_CONSOLE_UI_SETTING_ID
    );
    const embeddedConsoleAvailable =
      isConsoleUiEnabled &&
      isEmbeddedConsoleEnabled &&
      core.application.capabilities?.dev_tools?.show === true &&
      embeddedConsoleUiSetting;

    if (embeddedConsoleAvailable) {
      consoleStart.EmbeddableConsole = (_props: {}) => {
        return EmbeddableConsole({
          core,
          data: deps.data,
          licensing: deps.licensing,
          usageCollection: deps.usageCollection,
          setDispatch: (d) => {
            this._embeddableConsole.setDispatch(d);
          },
          alternateView: this._embeddableConsole.alternateView,
          isDevMode,
          getConsoleHeight: this._embeddableConsole.getConsoleHeight.bind(this._embeddableConsole),
          setConsoleHeight: this._embeddableConsole.setConsoleHeight.bind(this._embeddableConsole),
        });
      };
      consoleStart.isEmbeddedConsoleAvailable = () =>
        this._embeddableConsole.isEmbeddedConsoleAvailable();
      consoleStart.openEmbeddedConsole = (content?: string) =>
        this._embeddableConsole.openEmbeddedConsole(content);
      consoleStart.openEmbeddedConsoleAlternateView = () =>
        this._embeddableConsole.openEmbeddedConsoleAlternateView();
      consoleStart.registerEmbeddedConsoleAlternateView = (view: EmbeddedConsoleView | null) => {
        this._embeddableConsole.registerAlternateView(view);
      };
    }

    return consoleStart;
  }
}

// ---------------------------------------------------------------------------
// ES autocomplete facade — exposed via ConsolePluginSetup for other plugins
// ---------------------------------------------------------------------------

function createEsAutocompleteFacade(http: HttpSetup) {
  let specsLoading: Promise<void> | null = null;
  const ensureLoaded = () => {
    if (!specsLoading) {
      specsLoading = import('./lib/kb/kb').then(({ loadActiveApi }) => loadActiveApi(http));
    }
    return specsLoading;
  };

  const perModelProviders = new Map<string, any>();

  return {
    requestCellProvider: {
      triggerCharacters: [' ', '\n', '/'],
      async provideCompletionItems(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.CompletionContext
      ) {
        await ensureLoaded();
        let provider = perModelProviders.get(model.id);
        if (!provider) {
          const editor = monaco.editor.getEditors().find((e) => e.getModel()?.id === model.id);
          if (!editor) return { suggestions: [] };
          const { MonacoEditorActionsProvider } = await import(
            './application/containers/editor/monaco_editor_actions_provider'
          );
          provider = new MonacoEditorActionsProvider(editor, () => {}, '');
          perModelProviders.set(model.id, provider);
          model.onWillDispose(() => perModelProviders.delete(model.id));
        }
        return provider.provideCompletionItems(model, position, context);
      },
    } as monaco.languages.CompletionItemProvider,

    async completeUrl(
      method: string,
      pathBeforeCursor: string,
      actualModel: monaco.editor.ITextModel,
      actualPosition: monaco.Position
    ): Promise<monaco.languages.CompletionList> {
      await ensureLoaded();
      const { getUrlPathCompletionItems } = await import(
        './application/containers/editor/utils/autocomplete_utils'
      );
      const syntheticContent = `${method.toUpperCase()} ${pathBeforeCursor}`;
      const syntheticModel = monaco.editor.createModel(syntheticContent, CONSOLE_LANG_ID);
      const syntheticPosition = {
        lineNumber: 1,
        column: syntheticContent.length + 1,
      } as monaco.Position;
      try {
        const items = getUrlPathCompletionItems(syntheticModel, syntheticPosition);
        const wordUntil = actualModel.getWordUntilPosition(actualPosition);
        const range = {
          startLineNumber: actualPosition.lineNumber,
          endLineNumber: actualPosition.lineNumber,
          startColumn: wordUntil.startColumn,
          endColumn: actualPosition.column,
        };
        return { suggestions: items.map((item) => ({ ...item, range })) };
      } finally {
        syntheticModel.dispose();
      }
    },

    async completeBody(
      method: string,
      path: string,
      bodyBeforeCursor: string,
      actualModel: monaco.editor.ITextModel,
      actualPosition: monaco.Position
    ): Promise<monaco.languages.CompletionList> {
      await ensureLoaded();
      const { getBodyCompletionItems } = await import(
        './application/containers/editor/utils/autocomplete_utils'
      );
      const methodLine = `${method.toUpperCase()} ${path}`;
      const syntheticContent = `${methodLine}\n${bodyBeforeCursor}`;
      const syntheticModel = monaco.editor.createModel(syntheticContent, CONSOLE_LANG_ID);
      const bodyLines = bodyBeforeCursor.split('\n');
      const syntheticPosition = {
        lineNumber: 1 + bodyLines.length,
        column: bodyLines[bodyLines.length - 1].length + 1,
      } as monaco.Position;
      try {
        const items = await getBodyCompletionItems(
          syntheticModel,
          syntheticPosition,
          1,
          null as any
        );
        const wordUntil = actualModel.getWordUntilPosition(actualPosition);
        const range = {
          startLineNumber: actualPosition.lineNumber,
          endLineNumber: actualPosition.lineNumber,
          startColumn: wordUntil.startColumn,
          endColumn: actualPosition.column,
        };
        return { suggestions: items.map((item) => ({ ...item, range })) };
      } finally {
        syntheticModel.dispose();
      }
    },
  };
}
