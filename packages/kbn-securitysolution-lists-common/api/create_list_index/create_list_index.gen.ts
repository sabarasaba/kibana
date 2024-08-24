/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Create list DS API endpoint
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';

export type CreateListIndexResponse = z.infer<typeof CreateListIndexResponse>;
export const CreateListIndexResponse = z.object({
  acknowledged: z.boolean(),
});
