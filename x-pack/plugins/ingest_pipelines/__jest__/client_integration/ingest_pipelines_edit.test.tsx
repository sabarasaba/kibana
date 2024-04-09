/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { omit } from 'lodash';
import { act } from 'react-dom/test-utils';

import { setupEnvironment, pageHelpers } from './helpers';
import { API_BASE_PATH } from '../../common/constants';
import { PIPELINE_TO_EDIT, PipelinesEditTestBed } from './helpers/pipelines_edit.helpers';

const { setup } = pageHelpers.pipelinesEdit;

describe('<PipelinesEdit />', () => {
  let testBed: PipelinesEditTestBed;

  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  beforeEach(async () => {
    httpRequestsMockHelpers.setLoadPipelineResponse(PIPELINE_TO_EDIT.name, PIPELINE_TO_EDIT);

    await act(async () => {
      testBed = await setup(httpSetup);
    });

    testBed.component.update();
  });

  test('should render the correct page header', () => {
    const { exists, find } = testBed;

    // Verify pipeline name is visible
    expect(exists('pipelineName')).toBe(true);

    // Verify documentation link
    expect(exists('documentationLink')).toBe(true);
    expect(find('documentationLink').text()).toBe('Documentation');
  });

  it('should disable the name field', () => {
    const { find } = testBed;

    const inlineEditButton = find('pipelineName').find('button');
    expect(inlineEditButton.props().disabled).toEqual(true);
  });

  it('should show deprecated callout', () => {
    const { exists } = testBed;

    expect(exists('deprecatedPipelineCallout')).toBe(true);
  });

  describe('form submission', () => {
    it('should send the correct payload with changed values', async () => {
      const UPDATED_DESCRIPTION = 'updated pipeline description';
      const { actions } = testBed;

      // Make change to description field
      await actions.setInlineEditValue('pipelineDescription', UPDATED_DESCRIPTION);

      await actions.clickSubmitButton();

      const { name, ...pipelineDefinition } = PIPELINE_TO_EDIT;
      expect(httpSetup.put).toHaveBeenLastCalledWith(
        `${API_BASE_PATH}/${name}`,
        expect.objectContaining({
          body: JSON.stringify({
            ...omit(pipelineDefinition, 'deprecated'),
            description: UPDATED_DESCRIPTION,
          }),
        })
      );
    });
  });
});
