/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { addBasePath } from '..';
import { RouterMock, routeDependencies, RequestMock } from '../../../test/helpers';
import { serializeEnrichmentPolicies } from '../../../lib/enrich_policies';

import { registerEnrichPoliciesRoute } from './register_enrich_policies_routes';

const mockedPolicy = {
  config: {
    match: {
      name: 'my-policy',
      indices: ['users'],
      match_field: 'email',
      enrich_fields: ['first_name', 'last_name', 'city', 'zip', 'state'],
    },
  },
};

describe('Enrich policies API', () => {
  const router = new RouterMock();

  beforeEach(() => {
    registerEnrichPoliciesRoute({
      ...routeDependencies,
      router,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Get all policies - GET /api/index_management/enrich_policies', () => {
    const getEnrichPolicies = router.getMockESApiFn('enrich.getPolicy');

    it('returns all available policies', async () => {
      const mockRequest: RequestMock = {
        method: 'get',
        path: addBasePath('/enrich_policies'),
      };

      getEnrichPolicies.mockResolvedValue({ policies: [mockedPolicy] });

      const res = await router.runRequest(mockRequest);

      expect(res).toEqual({
        body: serializeEnrichmentPolicies([mockedPolicy]),
      });
    });

    it('should return an error if it fails', async () => {
      const mockRequest: RequestMock = {
        method: 'get',
        path: addBasePath('/enrich_policies'),
      };

      const error = new Error('Oh no!');
      getEnrichPolicies.mockRejectedValue(error);

      await expect(router.runRequest(mockRequest)).rejects.toThrowError(error);
    });
  });
});
