/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { DomainDeprecationDetails } from 'kibana/public';
import { UpgradeAssistantStatus } from '../../../../common/types';

export const esDeprecations: UpgradeAssistantStatus = {
  readyForUpgrade: false,
  cluster: [
    {
      level: 'critical',
      message: 'Index Lifecycle Management poll interval is set too low',
      url:
        'https://www.elastic.co/guide/en/elasticsearch/reference/master/breaking-changes-8.0.html#ilm-poll-interval-limit',
      details:
        'The Index Lifecycle Management poll interval setting [indices.lifecycle.poll_interval] is currently set to [500ms], but must be 1s or greater',
    },
  ],
  indices: [
    {
      level: 'warning',
      message: 'translog retention settings are ignored',
      url:
        'https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-translog.html',
      details:
        'translog retention settings [index.translog.retention.size] and [index.translog.retention.age] are ignored because translog is no longer used in peer recoveries with soft-deletes enabled (default in 7.0 or later)',
      index: 'settings',
    },
  ],
};

export const esDeprecationsEmpty: UpgradeAssistantStatus = {
  readyForUpgrade: true,
  cluster: [],
  indices: [],
};

export const kibanaDeprecations: DomainDeprecationDetails[] = [
  {
    correctiveActions: { manualSteps: ['test-step'] },
    domainId: 'xpack.spaces',
    level: 'critical',
    message:
      'Disabling the Spaces plugin (xpack.spaces.enabled) will not be supported in the next major version (8.0)',
  },
  {
    correctiveActions: { manualSteps: ['test-step'] },
    domainId: 'xpack.spaces',
    level: 'warning',
    message: 'Sample warning deprecation',
  },
];
