/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { SavedObjectUnsanitizedDoc } from '@kbn/core/server';
import { SyntheticsMonitorWithSecretsAttributes } from '../../../../../common/runtime_types';

export const browserUI = {
  type: 'synthetics-monitor',
  id: '311cf324-2fc9-4453-9ba5-5e745fd81722',
  attributes: {
    type: 'browser',
    form_monitor_type: 'multistep',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { unit: 'm', number: '10' },
    'service.name': '',
    config_id: '311cf324-2fc9-4453-9ba5-5e745fd81722',
    tags: [],
    timeout: null,
    name: 'https://elastic.co',
    locations: [
      {
        id: 'us_central',
        label: 'North America - US Central',
        geo: { lat: 41.25, lon: -95.86 },
        isServiceManaged: true,
      },
    ],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '311cf324-2fc9-4453-9ba5-5e745fd81722',
    project_id: '',
    playwright_options: '',
    __ui: {
      script_source: { is_generated_script: false, file_name: '' },
      is_zip_url_tls_enabled: false,
    },
    'url.port': null,
    'source.zip_url.url': '',
    'source.zip_url.folder': '',
    'source.zip_url.proxy_url': '',
    playwright_text_assertion: '',
    urls: 'https://elastic.co',
    screenshots: 'on',
    'filter_journeys.match': '',
    'filter_journeys.tags': [],
    ignore_https_errors: false,
    'throttling.is_enabled': true,
    'throttling.download_speed': '5',
    'throttling.upload_speed': '3',
    'throttling.latency': '20',
    'throttling.config': '5d/3u/20l',
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    revision: 1,
    secrets:
      '{"params":"","source.inline.script":"step(\'Go to https://elastic.co\', async () => {\\n  await page.goto(\'https://elastic.co\');\\n});","source.project.content":"","source.zip_url.username":"","source.zip_url.password":"","synthetics_args":[],"ssl.key":"","ssl.key_passphrase":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:31:24.177Z',
  created_at: '2023-03-31T20:31:24.177Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const browserSinglePageUI = {
  type: 'synthetics-monitor',
  id: '7a72e681-6033-444e-b402-bddbe4a9fc4e',
  attributes: {
    type: 'browser',
    form_monitor_type: 'single',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { unit: 'm', number: '10' },
    'service.name': '',
    config_id: '7a72e681-6033-444e-b402-bddbe4a9fc4e',
    tags: [],
    timeout: null,
    name: 'https://google.com',
    locations: [{ label: 'North America - US Central', id: 'us_central', isServiceManaged: true }],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '7a72e681-6033-444e-b402-bddbe4a9fc4e',
    project_id: '',
    playwright_options: '',
    __ui: {
      script_source: { is_generated_script: false, file_name: '' },
      is_zip_url_tls_enabled: false,
    },
    'url.port': null,
    'source.zip_url.url': '',
    'source.zip_url.folder': '',
    'source.zip_url.proxy_url': '',
    playwright_text_assertion: 'Google',
    urls: 'https://google.com',
    screenshots: 'on',
    'filter_journeys.match': '',
    'filter_journeys.tags': [],
    ignore_https_errors: false,
    'throttling.is_enabled': true,
    'throttling.download_speed': '5',
    'throttling.upload_speed': '3',
    'throttling.latency': '20',
    'throttling.config': '5d/3u/20l',
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    revision: 1,
    secrets:
      '{"params":"","source.inline.script":"step(\'Go to https://google.com\', async () => {\\n          await page.goto(\'https://google.com\');\\n          expect(await page.isVisible(\'text=Google\')).toBeTruthy();\\n        });","source.project.content":"","source.zip_url.username":"","source.zip_url.password":"","synthetics_args":[],"ssl.key":"","ssl.key_passphrase":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:32:01.498Z',
  created_at: '2023-03-31T20:32:01.498Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const httpUI = {
  type: 'synthetics-monitor',
  id: '8f4ad634-205b-440b-80c6-27aa6ef57bba',
  attributes: {
    type: 'http',
    form_monitor_type: 'http',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '3', unit: 'm' },
    'service.name': '',
    config_id: '8f4ad634-205b-440b-80c6-27aa6ef57bba',
    tags: [],
    timeout: '16',
    name: 'https://github.com',
    locations: [{ label: 'North America - US Central', id: 'us_central', isServiceManaged: true }],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '8f4ad634-205b-440b-80c6-27aa6ef57bba',
    __ui: { is_tls_enabled: false },
    urls: 'https://github.com',
    max_redirects: '0',
    'url.port': null,
    proxy_url: '',
    'response.include_body': 'on_error',
    'response.include_headers': true,
    'check.response.status': [],
    'check.request.method': 'GET',
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    revision: 1,
    secrets:
      '{"password":"","check.request.body":{"type":"text","value":""},"check.request.headers":{},"check.response.body.negative":[],"check.response.body.positive":[],"check.response.headers":{},"ssl.key":"","ssl.key_passphrase":"","username":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:32:14.362Z',
  created_at: '2023-03-31T20:32:14.362Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const tcpUI = {
  type: 'synthetics-monitor',
  id: 'b56a8fab-9a69-4435-b368-cc4fe6cdc6b0',
  attributes: {
    type: 'tcp',
    form_monitor_type: 'tcp',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '3', unit: 'm' },
    'service.name': '',
    config_id: 'b56a8fab-9a69-4435-b368-cc4fe6cdc6b0',
    tags: [],
    timeout: '16',
    name: 'smtp.gmail.com:587',
    locations: [{ label: 'North America - US Central', id: 'us_central', isServiceManaged: true }],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: 'b56a8fab-9a69-4435-b368-cc4fe6cdc6b0',
    __ui: { is_tls_enabled: false },
    hosts: 'smtp.gmail.com:587',
    urls: '',
    'url.port': null,
    proxy_url: '',
    proxy_use_local_resolver: false,
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    revision: 1,
    secrets: '{"check.send":"","check.receive":"","ssl.key":"","ssl.key_passphrase":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:32:27.678Z',
  created_at: '2023-03-31T20:32:27.678Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
const icmpUI = {
  type: 'synthetics-monitor',
  id: '1b625301-fe0b-46c0-9980-21347c58a6f8',
  attributes: {
    type: 'icmp',
    form_monitor_type: 'icmp',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '3', unit: 'm' },
    'service.name': '',
    config_id: '1b625301-fe0b-46c0-9980-21347c58a6f8',
    tags: [],
    timeout: '16',
    name: '1.1.1.1',
    locations: [{ label: 'North America - US Central', id: 'us_central', isServiceManaged: true }],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '1b625301-fe0b-46c0-9980-21347c58a6f8',
    hosts: '1.1.1.1',
    wait: '1',
    revision: 1,
    secrets: '{}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:32:39.147Z',
  created_at: '2023-03-31T20:32:39.147Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const browserUptimeUI = {
  type: 'synthetics-monitor',
  id: '9bf12063-271f-47b1-9121-db1d14a71bb3',
  attributes: {
    type: 'browser',
    form_monitor_type: 'multistep',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '240', unit: 'm' },
    'service.name': '',
    config_id: '9bf12063-271f-47b1-9121-db1d14a71bb3',
    tags: [],
    timeout: null,
    name: 'A browser monitor with an invalid schedule 600',
    locations: [
      {
        id: 'us_central',
        label: 'North America - US Central',
        geo: { lat: 41.25, lon: -95.86 },
        isServiceManaged: true,
      },
    ],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '9bf12063-271f-47b1-9121-db1d14a71bb3',
    project_id: '',
    playwright_options: '',
    __ui: {
      script_source: { is_generated_script: false, file_name: '' },
      is_zip_url_tls_enabled: false,
      is_tls_enabled: false,
    },
    'url.port': null,
    'source.zip_url.url': '',
    'source.zip_url.folder': '',
    'source.zip_url.proxy_url': '',
    playwright_text_assertion: '',
    urls: '',
    screenshots: 'on',
    'filter_journeys.match': '',
    'filter_journeys.tags': [],
    ignore_https_errors: false,
    'throttling.is_enabled': true,
    'throttling.download_speed': '5',
    'throttling.upload_speed': '3',
    'throttling.latency': '20',
    'throttling.config': '5d/3u/20l',
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    revision: 1,
    secrets:
      '{"params":"","source.inline.script":"lkjelre","source.project.content":"","source.zip_url.username":"","source.zip_url.password":"","synthetics_args":[],"ssl.key":"","ssl.key_passphrase":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:35:34.916Z',
  created_at: '2023-03-31T20:35:34.916Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const tcpUptimeUI = {
  type: 'synthetics-monitor',
  id: '726d3f74-7760-4045-ad8d-87642403c721',
  attributes: {
    type: 'tcp',
    form_monitor_type: 'tcp',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '8', unit: 'm' },
    'service.name': '',
    config_id: '726d3f74-7760-4045-ad8d-87642403c721',
    tags: [],
    timeout: '16',
    name: 'TCP monitor with invalid schedule 8m',
    locations: [
      {
        id: 'us_central',
        label: 'North America - US Central',
        geo: { lat: 41.25, lon: -95.86 },
        isServiceManaged: true,
      },
    ],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '726d3f74-7760-4045-ad8d-87642403c721',
    __ui: { is_tls_enabled: false, is_zip_url_tls_enabled: false },
    hosts: 'localhost:5601',
    urls: '',
    'url.port': null,
    proxy_url: '',
    proxy_use_local_resolver: false,
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    revision: 1,
    secrets: '{"check.send":"","check.receive":"","ssl.key":"","ssl.key_passphrase":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:38:29.582Z',
  created_at: '2023-03-31T20:38:29.582Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const httpUptimeUI = {
  type: 'synthetics-monitor',
  id: '35b2d765-4a62-4511-91c8-d5d52fdf4639',
  attributes: {
    type: 'http',
    form_monitor_type: 'http',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '4', unit: 'm' },
    'service.name': '',
    config_id: '35b2d765-4a62-4511-91c8-d5d52fdf4639',
    tags: [],
    timeout: '16',
    name: 'HTTP monitor with invalid schedule 4m',
    locations: [
      {
        id: 'us_central',
        label: 'North America - US Central',
        geo: { lat: 41.25, lon: -95.86 },
        isServiceManaged: true,
      },
    ],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '35b2d765-4a62-4511-91c8-d5d52fdf4639',
    __ui: { is_tls_enabled: false, is_zip_url_tls_enabled: false },
    urls: 'https://google.com',
    max_redirects: '0',
    'url.port': null,
    proxy_url: '',
    'response.include_body': 'on_error',
    'response.include_headers': true,
    'check.response.status': [],
    'check.request.method': 'GET',
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    revision: 1,
    secrets:
      '{"password":"","check.request.body":{"type":"text","value":""},"check.request.headers":{},"check.response.body.negative":[],"check.response.body.positive":[],"check.response.headers":{},"ssl.key":"","ssl.key_passphrase":"","username":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:37:24.093Z',
  created_at: '2023-03-31T20:37:24.093Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const icmpUptimeUI = {
  type: 'synthetics-monitor',
  id: '28b14c99-4a39-475d-9545-21b35b35751d',
  attributes: {
    type: 'icmp',
    form_monitor_type: 'icmp',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '11', unit: 'm' },
    'service.name': '',
    config_id: '28b14c99-4a39-475d-9545-21b35b35751d',
    tags: [],
    timeout: '16',
    name: 'ICMP monitor with invalid schedule 11m',
    locations: [
      {
        geo: { lon: -95.86, lat: 41.25 },
        isServiceManaged: true,
        id: 'us_central',
        label: 'North America - US Central',
      },
    ],
    namespace: 'default',
    origin: 'ui',
    journey_id: '',
    hash: '',
    id: '28b14c99-4a39-475d-9545-21b35b35751d',
    hosts: '1.1.1.1',
    wait: '1',
    revision: 2,
    secrets: '{}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:40:28.889Z',
  created_at: '2023-03-31T20:39:13.783Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const browserProject = {
  type: 'synthetics-monitor',
  id: 'ea123f46-eb02-4a8a-b3ce-53e645ce4aef',
  attributes: {
    type: 'browser',
    form_monitor_type: 'multistep',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '10', unit: 'm' },
    'service.name': '',
    config_id: 'ea123f46-eb02-4a8a-b3ce-53e645ce4aef',
    tags: [],
    timeout: null,
    name: 'addition and completion of single task',
    locations: [
      {
        id: 'us_central',
        label: 'North America - US Central',
        geo: { lat: 41.25, lon: -95.86 },
        isServiceManaged: true,
      },
    ],
    namespace: 'default',
    origin: 'project',
    journey_id: 'addition and completion of single task',
    hash: '7a7cyPraVarTWfDHyqSgXBktTAcuwwWtcB+IGdNZF14=',
    id: 'addition and completion of single task-test2-default',
    project_id: 'test2',
    playwright_options: '{"ignoreHTTPSErrors":true,"headless":true}',
    __ui: {
      script_source: { is_generated_script: false, file_name: '' },
      is_zip_url_tls_enabled: false,
    },
    'url.port': null,
    'source.zip_url.url': '',
    'source.zip_url.folder': '',
    'source.zip_url.proxy_url': '',
    playwright_text_assertion: '',
    urls: '',
    screenshots: 'on',
    'filter_journeys.match': 'addition and completion of single task',
    'filter_journeys.tags': [],
    ignore_https_errors: false,
    'throttling.is_enabled': true,
    'throttling.download_speed': '5',
    'throttling.upload_speed': '3',
    'throttling.latency': '20',
    'throttling.config': '5d/3u/20l',
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    original_space: 'default',
    custom_heartbeat_id: 'addition and completion of single task-test2-default',
    revision: 1,
    secrets:
      '{"params":"{\\"url\\":\\"https://elastic.github.io/synthetics-demo/\\"}","source.inline.script":"","source.project.content":"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","source.zip_url.username":"","source.zip_url.password":"","synthetics_args":[],"ssl.key":"","ssl.key_passphrase":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:43:35.214Z',
  created_at: '2023-03-31T20:43:35.214Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const httpProject = {
  type: 'synthetics-monitor',
  id: '316c0df8-56fc-428a-a477-7bf580f6cb4c',
  attributes: {
    type: 'http',
    form_monitor_type: 'http',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '10', unit: 'm' },
    'service.name': '',
    config_id: '316c0df8-56fc-428a-a477-7bf580f6cb4c',
    tags: ['org:elastics'],
    timeout: '16',
    name: 'facebook',
    locations: [
      {
        id: 'us_central',
        label: 'North America - US Central',
        geo: { lat: 41.25, lon: -95.86 },
        isServiceManaged: true,
      },
    ],
    namespace: 'default',
    origin: 'project',
    journey_id: 'an-id3',
    hash: 'thcZtI5hzo94RiDoK1B+MEwIPIzJMINtuA042Y+yrDU=',
    id: 'an-id3-test2-default',
    __ui: { is_tls_enabled: false },
    urls: 'https://www.facebook.com',
    max_redirects: '0',
    'url.port': null,
    proxy_url: '',
    'response.include_body': 'on_error',
    'response.include_headers': true,
    'check.response.status': [],
    'check.request.method': 'GET',
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    project_id: 'test2',
    original_space: 'default',
    custom_heartbeat_id: 'an-id3-test2-default',
    revision: 1,
    secrets:
      '{"password":"","check.request.body":{"type":"text","value":""},"check.request.headers":{"Content-Type":"text/plain"},"check.response.body.negative":[],"check.response.body.positive":[],"check.response.headers":{},"ssl.key":"","ssl.key_passphrase":"","username":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:43:35.214Z',
  created_at: '2023-03-31T20:43:35.214Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const icmpProject = {
  type: 'synthetics-monitor',
  id: 'e21a30b5-6d40-4458-8cff-9003d7b83eb6',
  attributes: {
    type: 'icmp',
    form_monitor_type: 'icmp',
    enabled: true,
    alert: { status: { enabled: true } },
    schedule: { number: '10', unit: 'm' },
    'service.name': '',
    config_id: 'e21a30b5-6d40-4458-8cff-9003d7b83eb6',
    tags: ['service:dns', 'org:cloudflare'],
    timeout: '16',
    name: 'Cloudflare DNS',
    locations: [
      {
        id: 'us_central',
        label: 'North America - US Central',
        geo: { lat: 41.25, lon: -95.86 },
        isServiceManaged: true,
      },
    ],
    namespace: 'default',
    origin: 'project',
    journey_id: 'stuff',
    hash: 'fZfJJOKGdjznBxHZLgLrWbkvUI/AH4SzFqweV/NnpIw=',
    id: 'stuff-test2-default',
    hosts: '${random_host}',
    wait: '1',
    project_id: 'test2',
    original_space: 'default',
    custom_heartbeat_id: 'stuff-test2-default',
    revision: 1,
    secrets: '{}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:43:35.214Z',
  created_at: '2023-03-31T20:43:35.214Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;
export const tcpProject = {
  type: 'synthetics-monitor',
  id: '9f5d6206-9a1d-47fb-bd67-c7895b07f716',
  attributes: {
    type: 'tcp',
    form_monitor_type: 'tcp',
    enabled: true,
    alert: { status: { enabled: false } },
    schedule: { number: '30', unit: 'm' },
    'service.name': '',
    config_id: '9f5d6206-9a1d-47fb-bd67-c7895b07f716',
    tags: ['service:smtp', 'org:google'],
    timeout: '16',
    name: 'GMail SMTP',
    locations: [
      {
        geo: { lon: -95.86, lat: 41.25 },
        isServiceManaged: true,
        id: 'us_central',
        label: 'North America - US Central',
      },
    ],
    namespace: 'default',
    origin: 'project',
    journey_id: 'gmail-smtp',
    hash: 'BoPnjeryNLnktKz+PeeHwHKzEnZaxHNJmAUjlOVKfRY=',
    id: 'gmail-smtp-test2-default',
    __ui: { is_tls_enabled: false },
    hosts: '${random_host}',
    urls: '',
    'url.port': null,
    proxy_url: '',
    proxy_use_local_resolver: false,
    'ssl.certificate_authorities': '',
    'ssl.certificate': '',
    'ssl.verification_mode': 'full',
    'ssl.supported_protocols': ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
    project_id: 'test2',
    original_space: 'default',
    custom_heartbeat_id: 'gmail-smtp-test2-default',
    revision: 3,
    secrets: '{"check.send":"","check.receive":"","ssl.key":"","ssl.key_passphrase":""}',
  },
  references: [],
  coreMigrationVersion: '8.8.0',
  updated_at: '2023-03-31T20:47:15.781Z',
  created_at: '2023-03-31T20:43:35.214Z',
  typeMigrationVersion: '8.6.0',
} as SavedObjectUnsanitizedDoc<SyntheticsMonitorWithSecretsAttributes>;

export const testMonitors = [
  browserUI,
  browserSinglePageUI,
  httpUI,
  tcpUI,
  icmpUI,
  browserUptimeUI,
  httpUptimeUI,
  tcpUptimeUI,
  icmpUptimeUI,
  browserProject,
  httpProject,
  tcpProject,
  icmpProject,
];
