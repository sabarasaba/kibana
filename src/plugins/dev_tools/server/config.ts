/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { schema, TypeOf } from '@kbn/config-schema';
import { PluginConfigDescriptor } from '@kbn/core-plugins-server';

const configSchema = schema.object({
  serverless: schema.object({
    enabled: schema.conditional(
      schema.contextRef('serverless'),
      true,
      schema.literal(true),
      schema.never(),
      { defaultValue: schema.contextRef('serverless') }
    ),
  }),
});

export type DevToolsConfig = TypeOf<typeof configSchema>;

export type DevToolsPublicConfig = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<DevToolsPublicConfig> = {
  exposeToBrowser: {
    serverless: true,
  },
  schema: configSchema,
};
