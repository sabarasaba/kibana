/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { convertFeaturesListToIndexArray } from './es_system_indices_upgrade';
import { SystemIndicesUpgradeStatus } from '../../common/types';

const esUpgradeSystemIndicesStatusMock: SystemIndicesUpgradeStatus = {
  features: [
    {
      feature_name: 'machine_learning',
      minimum_index_version: '7.1.1',
      upgrade_status: 'UPGRADE_NEEDED',
      indices: [
        {
          index: '.ml-config',
          version: '7.1.1',
        },
        {
          index: '.ml-notifications',
          version: '7.1.1',
        },
      ],
    },
    {
      feature_name: 'security',
      minimum_index_version: '7.1.1',
      upgrade_status: 'UPGRADE_NEEDED',
      indices: [
        {
          index: '.ml-config',
          version: '7.1.1',
        },
      ],
    },
  ],
  upgrade_status: 'UPGRADE_NEEDED',
};

describe('convertFeaturesListToIndexArray', () => {
  it('converts list with features to flat array of uniq indices', async () => {
    const result = convertFeaturesListToIndexArray(esUpgradeSystemIndicesStatusMock.features);
    expect(result).toEqual(['.ml-config', '.ml-notifications']);
  });

  it('returns empty array if no features are passed to it', async () => {
    const result = convertFeaturesListToIndexArray([]);
    expect(result).toEqual([]);
  });
});
