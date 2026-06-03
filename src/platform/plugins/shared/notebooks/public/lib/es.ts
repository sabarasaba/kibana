/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { HttpSetup, IHttpFetchError } from '@kbn/core/public';

const PROXY_PATH = '/api/console/proxy';

export interface EsResponse {
  statusCode: number;
  statusText: string;
  body: unknown;
}

function extractStatus(response: Response | undefined): { statusCode: number; statusText: string } {
  const proxyCode = response?.headers.get('x-console-proxy-status-code');
  const proxyText = response?.headers.get('x-console-proxy-status-text');
  if (proxyCode) {
    return { statusCode: parseInt(proxyCode, 10), statusText: proxyText ?? '' };
  }
  return { statusCode: response?.status ?? 500, statusText: response?.statusText ?? 'error' };
}

export async function sendRequest(
  http: HttpSetup,
  method: string,
  path: string,
  body?: string
): Promise<EsResponse> {
  try {
    const result = await http.post<unknown>(PROXY_PATH, {
      query: { path, method },
      ...(body ? { body } : {}),
      asResponse: true,
    });

    const { response, body: responseBody } = result as {
      response?: Response;
      body: unknown;
    };
    const { statusCode, statusText } = extractStatus(response);
    return { statusCode, statusText, body: responseBody };
  } catch (err: unknown) {
    const fetchError = err as IHttpFetchError;
    const { statusCode, statusText } = extractStatus(fetchError.response);
    return { statusCode, statusText, body: fetchError.body ?? null };
  }
}
