/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import type { CoreStart } from '@kbn/core/public';
import { KibanaRenderContextProvider } from '@kbn/react-kibana-context-render';
import type { EsAutocompleteFacade } from '../types';
import { Notebook } from './components/notebook';

export function renderApp(
  coreStart: CoreStart,
  element: HTMLElement,
  esAutocompleteFacade?: EsAutocompleteFacade
): () => void {
  render(
    <KibanaRenderContextProvider {...coreStart}>
      <Notebook http={coreStart.http} esAutocompleteFacade={esAutocompleteFacade} />
    </KibanaRenderContextProvider>,
    element
  );

  return () => unmountComponentAtNode(element);
}
