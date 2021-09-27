/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { schema, TypeOf } from '@kbn/config-schema';

export const configSchema = schema.object({
  graphiteUrls: schema.maybe(schema.arrayOf(schema.string())),
  enabled: schema.boolean({ defaultValue: true }),
  // should be removed in v8.0
  /** @deprecated **/
  ui: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
