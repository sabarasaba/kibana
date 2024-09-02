/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiTourStepProps,
  EuiTourActions,
  EuiTourState,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React from 'react';
import { ConsoleTourStepProps } from '../../components';
import { SHELL_TAB_ID } from './constants';

export const getConsoleTourStepProps = (
  stateTourStepProps: EuiTourStepProps[],
  actions: EuiTourActions,
  tourState: EuiTourState,
  selectedTab: string,
): ConsoleTourStepProps[] => {
  return stateTourStepProps.map((step: EuiTourStepProps) => {
    const nextTourStep = () => {
      if (tourState.currentTourStep < 5) {
        // If the user is not on the shell tab and the current step is welcome to
        // console, skip the editor query step.
        if (selectedTab !== SHELL_TAB_ID && tourState.currentTourStep === 1) {
          return actions.goToStep(3);
        }

        actions.incrementStep();
      }
    };

    return {
      step: step.step,
      stepsTotal: step.stepsTotal,
      isStepOpen: step.step === tourState.currentTourStep && tourState.isTourActive,
      title: step.title,
      content: step.content,
      anchorPosition: step.anchorPosition,
      dataTestSubj: step['data-test-subj'],
      maxWidth: step.maxWidth,
      css: step.css,
      onFinish: () => actions.finishTour(false),
      footerAction:
        tourState.currentTourStep === stateTourStepProps.length ? (
          <EuiButton
            color="success"
            size="s"
            onClick={() => actions.finishTour()}
            data-test-subj="consoleCompleteTourButton"
          >
            {i18n.translate('console.tour.completeTourButton', {
              defaultMessage: 'Complete',
            })}
          </EuiButton>
        ) : (
          [
            <EuiButtonEmpty
              size="s"
              color="text"
              onClick={() => actions.finishTour()}
              data-test-subj="consoleSkipTourButton"
            >
              {i18n.translate('console.tour.skipTourButton', {
                defaultMessage: 'Skip tour',
              })}
            </EuiButtonEmpty>,
            <EuiButton
              color="success"
              size="s"
              onClick={nextTourStep}
              data-test-subj="consoleNextTourStepButton"
            >
              {i18n.translate('console.tour.nextStepButton', {
                defaultMessage: 'Next',
              })}
            </EuiButton>,
          ]
        ),
    } as ConsoleTourStepProps;
  });
};
