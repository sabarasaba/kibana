/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { formatRequestBodyDoc } from '../../lib/utils';
import { ESRequest } from '../../types';

export function getFormattedRequest(
  req: ESRequest
) {
  let res = req.method + ' ' + req.endpoint;
  if (req.data) {
    const indent = true;
    const formattedData = formatRequestBodyDoc([req.data], indent);
    res += '\n' + formattedData.data;
  }

  return res;
}
