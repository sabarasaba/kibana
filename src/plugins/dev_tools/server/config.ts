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
  deeplinks: schema.object({
    navLinkStatus: schema.string({ defaultValue: 'default' }),
  }),
});

export type DevToolsConfig = TypeOf<typeof configSchema>;

export type DevToolsPublicConfig = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<DevToolsPublicConfig> = {
  exposeToBrowser: {
    deeplinks: true,
  },
  schema: configSchema,
};
