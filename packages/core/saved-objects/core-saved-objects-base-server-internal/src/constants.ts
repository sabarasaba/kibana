/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { IndexTypesMap } from './mappings';

/**
 * This map holds the default breakdown of SO types per index (pre 8.8.0)
 */
export const DEFAULT_INDEX_TYPES_MAP: IndexTypesMap = {
  '.kibana_task_manager': ['task'],
  '.kibana': [
    'action',
    'action_task_params',
    'alert',
    'api_key_pending_invalidation',
    'apm-indices',
    'apm-server-schema',
    'apm-service-group',
    'apm-telemetry',
    'app_search_telemetry',
    'application_usage_daily',
    'application_usage_totals',
    'book',
    'canvas-element',
    'canvas-workpad',
    'canvas-workpad-template',
    'cases',
    'cases-comments',
    'cases-configure',
    'cases-connector-mappings',
    'cases-telemetry',
    'cases-user-actions',
    'config',
    'config-global',
    'connector_token',
    'core-usage-stats',
    'csp-rule-template',
    'dashboard',
    'endpoint:user-artifact-manifest',
    'enterprise_search_telemetry',
    'epm-packages',
    'epm-packages-assets',
    'event_loop_delays_daily',
    'exception-list',
    'exception-list-agnostic',
    'file',
    'file-upload-usage-collection-telemetry',
    'fileShare',
    'fleet-fleet-server-host',
    'fleet-message-signing-keys',
    'fleet-preconfiguration-deletion-record',
    'fleet-proxy',
    'graph-workspace',
    'guided-onboarding-guide-state',
    'guided-onboarding-plugin-state',
    'index-pattern',
    'infrastructure-monitoring-log-view',
    'infrastructure-ui-source',
    'ingest-agent-policies',
    'ingest-download-sources',
    'ingest-outputs',
    'ingest-package-policies',
    'ingest_manager_settings',
    'inventory-view',
    'kql-telemetry',
    'legacy-url-alias',
    'lens',
    'lens-ui-telemetry',
    'map',
    'metrics-explorer-view',
    'ml-job',
    'ml-module',
    'ml-trained-model',
    'monitoring-telemetry',
    'osquery-manager-usage-metric',
    'osquery-pack',
    'osquery-pack-asset',
    'osquery-saved-query',
    'query',
    'rules-settings',
    'sample-data-telemetry',
    'search',
    'search-session',
    'search-telemetry',
    'searchableList',
    'security-rule',
    'security-solution-signals-migration',
    'siem-detection-engine-rule-actions',
    'siem-ui-timeline',
    'siem-ui-timeline-note',
    'siem-ui-timeline-pinned-event',
    'slo',
    'space',
    'spaces-usage-stats',
    'synthetics-monitor',
    'synthetics-param',
    'synthetics-privates-locations',
    'tag',
    'telemetry',
    'todo',
    'ui-metric',
    'upgrade-assistant-ml-upgrade-operation',
    'upgrade-assistant-reindex-operation',
    'uptime-dynamic-settings',
    'uptime-synthetics-api-key',
    'url',
    'usage-counters',
    'visualization',
    'workplace_search_telemetry',
  ],
};

/**
 * In order to be FIPS compliant, the migration logic has switched
 * from using hashes (stored in _meta.migrationMappingPropertyHashes)
 * to using model versions (stored in _meta.mappingVersions).
 *
 * This map holds a breakdown of md5 hashes to model versions.
 * This allows keeping track of changes in mappings for the different SO types:
 * When upgrading from a Kibana version prior to the introduction of model versions for V2,
 * the V2 logic will map stored hashes to their corresponding model versions.
 * These model versions will then be compared against the ones defined in the typeRegistry,
 * in order to determine which types' mappings have changed.
 */
export const HASH_TO_VERSION_MAP = {
  'action_task_params|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'action|0be88ebcc8560a075b6898236a202eb1': '10.0.0',
  'alert|96a5a144778243a9f4fece0e71c2197f': '10.0.0',
  'api_key_pending_invalidation|16f515278a295f6245149ad7c5ddedb7': '10.0.0',
  'apm-custom-dashboards|561810b957ac3c09fcfc08f32f168e97': '10.0.0',
  'apm-indices|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'apm-server-schema|b1d71908f324c17bf744ac72af5038fb': '10.0.0',
  'apm-service-group|2af509c6506f29a858e5a0950577d9fa': '10.0.0',
  'apm-telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'app_search_telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'application_usage_daily|43b8830d5d0df85a6823d290885fc9fd': '10.0.0',
  'application_usage_totals|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'canvas-element|7390014e1091044523666d97247392fc': '10.0.0',
  'canvas-workpad-template|ae2673f678281e2c055d764b153e9715': '10.0.0',
  'canvas-workpad|b0a1706d356228dbdcb4a17e6b9eb231': '10.0.0',
  'cases-comments|93535d41ca0279a4a2e5d08acd3f28e3': '10.0.0',
  'cases-configure|c124bd0be4c139d0f0f91fb9eeca8e37': '10.0.0',
  'cases-connector-mappings|a98c33813f364f0b068e8c592ac6ef6d': '10.0.0',
  'cases-rules|1cb4b03690489e07aa86f283dcea5ce1': '10.0.0',
  'cases-telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'cases-user-actions|07a6651cf37853dd5d64bfb2c796e102': '10.0.0',
  'cases|8f7dc53b17c272ea19f831537daa082d': '10.1.0',
  'cloud-security-posture-settings|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'config-global|c63748b75f39d0c54de12d12c1ccbc20': '10.0.0',
  'config|c63748b75f39d0c54de12d12c1ccbc20': '10.0.0',
  'connector_token|740b3fd18387d4097dca8d177e6a35c6': '10.0.0',
  'core-usage-stats|3d1b76c39bfb2cc8296b024d73854724': '7.14.1',
  'csp-rule-template|6ee70dc06c0ca3ddffc18222f202ab25': '10.0.0',
  'dashboard|b8aa800aa5e0d975c5e8dc57f03d41f8': '10.2.0',
  'endpoint:unified-user-artifact-manifest|393c6e4f5f16288c24ef9057e4d76a4c': '10.0.0',
  'endpoint:user-artifact-manifest|7502b5c5bc923abe8aa5ccfd636e8c3d': '10.0.0',
  'enterprise_search_telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'epm-packages-assets|44621b2f6052ef966da47b7c3a00f33b': '10.0.0',
  'epm-packages|8ce219acd0f6f3529237d52193866afb': '10.2.0',
  'event_loop_delays_daily|5df7e292ddd5028e07c1482e130e6654': '10.0.0',
  'event-annotation-group|df07b1a361c32daf4e6842c1d5521dbe': '10.0.0',
  'exception-list-agnostic|8a1defe5981db16792cb9a772e84bb9a': '10.0.0',
  'exception-list|8a1defe5981db16792cb9a772e84bb9a': '10.0.0',
  'file-upload-usage-collection-telemetry|a34fbb8e3263d105044869264860c697': '10.0.0',
  'file|8e9dd7f8a22efdb8fb1c15ed38fde9f6': '10.0.0',
  'fileShare|aa8f7ac2ddf8ab1a91bd34e347046caa': '10.0.0',
  'fleet-fleet-server-host|c28ce72481d1696a9aac8b2cdebcecfa': '10.1.0',
  'fleet-message-signing-keys|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'fleet-preconfiguration-deletion-record|4c36f199189a367e43541f236141204c': '10.0.0',
  'fleet-proxy|05b7a22977de25ce67a77e44dd8e6c33': '10.0.0',
  'fleet-uninstall-tokens|cdb2b655f6b468ecb57d132972425f2e': '10.0.0',
  'graph-workspace|27a94b2edcb0610c6aea54a7c56d7752': '10.0.0',
  'guided-onboarding-guide-state|a3db59c45a3fd2730816d4f53c35c7d9': '10.0.0',
  'guided-onboarding-plugin-state|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'index-pattern|83c02d842fe2a94d14dfa13f7dcd6e87': '10.0.0',
  'infra-custom-dashboards|1eb3c9e1888b8daea8495769e8d3ba2d': '10.2.0',
  'infrastructure-monitoring-log-view|c50526fc6040c5355ed027d34d05b35c': '10.0.0',
  'infrastructure-ui-source|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'ingest_manager_settings|b91ffb075799c78ffd7dbd51a279c8c9': '10.1.0',
  'ingest-agent-policies|0fd93cd11c019b118e93a9157c22057b': '10.1.0',
  'ingest-download-sources|0b0f6828e59805bd07a650d80817c342': '10.0.0',
  'ingest-outputs|b1237f7fdc0967709e75d65d208ace05': '10.6.0',
  'ingest-package-policies|a1a074bad36e68d54f98d2158d60f879': '10.0.0',
  'inventory-view|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'kql-telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'legacy-url-alias|0750774cf16475f88f2361e99cc5c8f0': '8.2.0',
  'lens-ui-telemetry|509bfa5978586998e05f9e303c07a327': '10.0.0',
  'lens|b0da10d5ab9ebd81d61700737ddc76c9': '10.0.0',
  'links|3378bb9b651572865d9f61f5b448e415': '10.0.0',
  'maintenance-window|a58ac2ef53ff5103710093e669dcc1d8': '10.0.0',
  'map|9134b47593116d7953f6adba096fc463': '10.0.0',
  'metrics-data-source|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'metrics-explorer-view|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'ml-job|3bb64c31915acf93fc724af137a0891b': '10.0.0',
  'ml-module|f6c6b7b7ebdca4154246923f24d6340d': '10.0.0',
  'ml-trained-model|d2f03c1a5dd038fa58af14a56944312b': '10.0.0',
  'monitoring-telemetry|2669d5ec15e82391cf58df4294ee9c68': '10.0.0',
  'observability-onboarding-state|a4e5c9d018037114140bdb1647c2d568': '10.0.0',
  'osquery-manager-usage-metric|4dc4f647d27247c002f56f22742175fe': '10.0.0',
  'osquery-pack-asset|fe0dfa13c4c24ac37ce1aec04c560a81': '10.1.0',
  'osquery-pack|6bc20973adab06f00156cbc4578a19ac': '10.1.0',
  'osquery-saved-query|a05ec7031231a4b71bfb4493a07b2dc5': '10.1.0',
  'policy-settings-protection-updates-note|37d4035a1dc3c5e58f1b519f99093f21': '10.0.0',
  'query|aa811b49f48906074f59110bfa83984c': '10.2.0',
  'risk-engine-configuration|431232781a82926aad5b1fd849715c0f': '10.1.0',
  'rules-settings|001f60645e96c71520214b57f3ea7590': '10.0.0',
  'sample-data-telemetry|7d3cfeb915303c9641c59681967ffeb4': '10.0.0',
  'search-session|fea3612a90b81672991617646f229a61': '10.0.0',
  'search-telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'search|df07b1a361c32daf4e6842c1d5521dbe': '10.0.0',
  'security-rule|9d9d11b97e3aaa87fbaefbace2b5c25f': '10.0.0',
  'security-solution-signals-migration|4060b5a63dddfd54d2cd56450882cc0e': '10.0.0',
  'siem-detection-engine-rule-actions|f5c218f837bac10ab2c3980555176cf9': '10.0.0',
  'siem-ui-timeline-note|28393dfdeb4e4413393eb5f7ec8c5436': '10.0.0',
  'siem-ui-timeline-pinned-event|293fce142548281599060e07ad2c9ddb': '10.0.0',
  'siem-ui-timeline|f6739fd4b17646a6c86321a746c247ef': '10.1.0',
  'slo-settings|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'slo|dc7f35c0cf07d71bb36f154996fe10c6': '10.1.0',
  'space|c3aec2a5d4afcb75554fed96411170e1': '10.0.0',
  'spaces-usage-stats|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'synthetics-monitor|918c09d935b1dcb6a84935b176262c3a': '10.1.0',
  'synthetics-param|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'synthetics-privates-locations|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'tag|83d55da58f6530f7055415717ec06474': '10.0.0',
  'task|b4a368fd68cd32ef6990877634639db6': '10.0.0',
  'telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'threshold-explorer-view|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'ui-metric|0d409297dc5ebe1e3a1da691c6ee32e3': '10.0.0',
  'upgrade-assistant-ml-upgrade-operation|3caf305ad2da94d80d49453b0970156d': '10.0.0',
  'upgrade-assistant-reindex-operation|6d1e2aca91767634e1829c30f20f6b16': '10.0.0',
  'uptime-dynamic-settings|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
  'uptime-synthetics-api-key|c3178f0fde61e18d3530ba9a70bc278a': '10.0.0',
  'url|a37dbae7645ad5811045f4dd3dc1c0a8': '10.0.0',
  'usage-counters|8cc260bdceffec4ffc3ad165c97dc1b4': '10.0.0',
  'visualization|4891c012863513388881fc109fec4809': '10.0.0',
  'workplace_search_telemetry|3d1b76c39bfb2cc8296b024d73854724': '10.0.0',
};
