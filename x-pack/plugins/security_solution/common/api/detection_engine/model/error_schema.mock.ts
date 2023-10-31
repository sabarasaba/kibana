/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
// TODO https://github.com/elastic/security-team/issues/7491
// eslint-disable-next-line no-restricted-imports
import type { ErrorSchema } from './error_schema_legacy';

export const getErrorSchemaMock = (
  id: string = '819eded6-e9c8-445b-a647-519aea39e063'
): ErrorSchema => ({
  id,
  error: {
    status_code: 404,
    message: 'id: "819eded6-e9c8-445b-a647-519aea39e063" not found',
  },
});
