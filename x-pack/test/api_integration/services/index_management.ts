/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../ftr_provider_context';
import { indicesApi } from '../apis/management/index_management/lib/indices.api';
import { indicesHelpers } from '../apis/management/index_management/lib/indices.helpers';
import { clusterNodesApi } from '../apis/management/index_management/lib/cluster_nodes.api';

export function IndexManagementProvider({ getService }: FtrProviderContext) {
  return {
    indices: {
      api: indicesApi(getService),
      helpers: indicesHelpers(getService),
    },
    clusterNodes: {
      api: clusterNodesApi(getService),
    },
  };
}
