/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { FC } from 'react';
import type {
  AnalyticsServiceStart,
  I18nStart,
  ThemeServiceStart,
  UserProfileService,
} from '@kbn/core/public';
import type { HomePublicPluginSetup, HomePublicPluginStart } from '@kbn/home-plugin/public';
import type { DevToolsSetup } from '@kbn/dev-tools-plugin/public';
import type {
  UsageCollectionSetup,
  UsageCollectionStart,
} from '@kbn/usage-collection-plugin/public';
import type { SharePluginSetup, SharePluginStart, LocatorPublic } from '@kbn/share-plugin/public';

import type { LicensingPluginStart } from '@kbn/licensing-plugin/public';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { monaco } from '@kbn/monaco';
import type { EmbeddedConsoleView } from './embeddable_console';
import type { ConsoleUILocatorParams } from './locator';

/**
 * Low-level ES autocomplete facade exposed to other plugins (e.g. Notebooks).
 * Provides completion items for ES endpoint paths and request bodies without
 * requiring the full Console editor stack.
 */
export interface EsAutocompleteFacade {
  /**
   * A Monaco CompletionItemProvider for CONSOLE_LANG_ID editors (request cells).
   * Register once globally via monaco.languages.registerCompletionItemProvider.
   */
  requestCellProvider: monaco.languages.CompletionItemProvider;

  /**
   * Returns path completions for a partial ES URL inside a script cell es.method('...') call.
   * @param method  HTTP method (GET, POST, etc.)
   * @param pathBeforeCursor  Path typed so far, including the leading slash
   * @param actualModel  The JavaScript editor model (used for range computation)
   * @param actualPosition  Cursor position in the JavaScript editor
   */
  completeUrl(
    method: string,
    pathBeforeCursor: string,
    actualModel: monaco.editor.ITextModel,
    actualPosition: monaco.Position
  ): Promise<monaco.languages.CompletionList>;

  /**
   * Returns body completions for an ES request body inside a script cell es.method('path', {...}) call.
   * @param method  HTTP method
   * @param path  Full ES path (e.g. /my-index/_search)
   * @param bodyBeforeCursor  Body text from after the opening { up to the cursor
   * @param actualModel  The JavaScript editor model
   * @param actualPosition  Cursor position in the JavaScript editor
   */
  completeBody(
    method: string,
    path: string,
    bodyBeforeCursor: string,
    actualModel: monaco.editor.ITextModel,
    actualPosition: monaco.Position
  ): Promise<monaco.languages.CompletionList>;
}

export interface ConsoleStartServices {
  analytics: Pick<AnalyticsServiceStart, 'reportEvent'>;
  i18n: I18nStart;
  theme: Pick<ThemeServiceStart, 'theme$'>;
  userProfile: UserProfileService;
}

export interface AppSetupUIPluginDependencies {
  home?: HomePublicPluginSetup;
  devTools: DevToolsSetup;
  share: SharePluginSetup;
  usageCollection?: UsageCollectionSetup;
}

export interface AppPluginSetupDependencies {
  data: DataPublicPluginStart;
  licensing: LicensingPluginStart;
}

export interface AppStartUIPluginDependencies {
  home?: HomePublicPluginStart;
  share: SharePluginStart;
  usageCollection?: UsageCollectionStart;
  data: DataPublicPluginStart;
  licensing: LicensingPluginStart;
}

/**
 * Console plugin's setup service object
 */
export interface ConsolePluginSetup {
  /**
   * Public locator for the console UI
   */
  locator?: LocatorPublic<ConsoleUILocatorParams>;
  /**
   * Returns an ES autocomplete facade for use in other plugins (e.g. Notebooks).
   * Provides completions for ES endpoint paths and request bodies.
   */
  getEsAutocompleteFacade?: () => EsAutocompleteFacade;
}

/**
 * Console plugin's start service object
 */
export interface ConsolePluginStart {
  /**
   * isEmbeddedConsoleAvailable is available if the embedded console can be rendered. Returns true when
   * called if the Embedded Console is currently rendered.
   */
  isEmbeddedConsoleAvailable?: () => boolean;
  /**
   * openEmbeddedConsole is available if the embedded console can be rendered. Calling
   * this function will open the embedded console on the page if it is currently rendered.
   */
  openEmbeddedConsole?: (content?: string) => void;
  /**
   * openEmbeddedConsoleAlternateView is available if the embedded console can be rendered.
   * Calling this function will open the embedded console to the alternative view. If there is no alternative view registered
   * this will open the embedded console.
   */
  openEmbeddedConsoleAlternateView?: () => void;
  /**
   * EmbeddableConsole is a functional component used to render a portable version of the dev tools console on any page in Kibana
   */
  EmbeddableConsole?: FC<{}>;
  /**
   * Register an alternate view for the Embedded Console
   *
   * When registering an alternate view ensure that the content component you register is lazy loaded.
   */
  registerEmbeddedConsoleAlternateView?: (view: EmbeddedConsoleView | null) => void;
}
