/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { API_BASE_PATH } from '../constants';
import { FtrProviderContext } from '../../../../ftr_provider_context';

export function clusterNodesApi(getService: FtrProviderContext['getService']) {
  const supertest = getService('supertest');

  const getNodesPlugins = () =>
    supertest
      .get(`${API_BASE_PATH}/nodes/plugins`)
      .set('kbn-xsrf', 'xxx')
      .set('x-elastic-internal-origin', 'xxx');

  return {
    getNodesPlugins
  };
}
