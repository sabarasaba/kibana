/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import expect from '@kbn/expect';
import { decodeOrThrow, indexPatternRt } from '@kbn/io-ts-utils';
import { DatasetSelectionPlain } from '@kbn/log-explorer-plugin/common';
import { FtrProviderContext } from './config';

const azureActivityDatasetSelection: DatasetSelectionPlain = {
  selection: {
    dataset: {
      name: decodeOrThrow(indexPatternRt)('logs-azure.activitylogs-*'),
      title: 'activitylogs',
    },
    name: 'azure',
    title: 'Azure Logs',
    version: '1.5.23',
  },
  selectionType: 'single',
};

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const browser = getService('browser');
  const retry = getService('retry');
  const PageObjects = getPageObjects(['common', 'observabilityLogExplorer']);

  describe('DatasetSelection initialization and update', () => {
    describe('when no dataset selection is given', () => {
      it('should initialize the "All logs" selection', async () => {
        await PageObjects.observabilityLogExplorer.navigateTo();
        const datasetSelectionTitle =
          await PageObjects.observabilityLogExplorer.getDatasetSelectorButtonText();

        expect(datasetSelectionTitle).to.be('All logs');
      });
    });

    describe('when a dataset selection is given', () => {
      it('should restore the selection from a valid encoded index', async () => {
        await PageObjects.observabilityLogExplorer.navigateTo({
          pageState: {
            datasetSelection: azureActivityDatasetSelection,
          },
        });

        const datasetSelectionTitle =
          await PageObjects.observabilityLogExplorer.getDatasetSelectorButtonText();

        expect(datasetSelectionTitle).to.be('[Azure Logs] activitylogs');
      });

      it('should fallback to the "All logs" selection and notify the user of an invalid encoded index', async () => {
        await PageObjects.observabilityLogExplorer.navigateToWithUncheckedState({
          pageState: {
            v: 1,
            datasetSelection: {
              selectionType: 'invalid',
            },
          },
        });

        const datasetSelectionTitle =
          await PageObjects.observabilityLogExplorer.getDatasetSelectorButtonText();

        await PageObjects.observabilityLogExplorer.assertRestoreFailureToastExist();
        expect(datasetSelectionTitle).to.be('All logs');
      });
    });

    describe('when navigating back and forth on the page history', () => {
      it('should decode and restore the selection for the current index', async () => {
        await PageObjects.observabilityLogExplorer.navigateTo();
        const allDatasetSelectionTitle =
          await PageObjects.observabilityLogExplorer.getDatasetSelectorButtonText();
        expect(allDatasetSelectionTitle).to.be('All logs');

        await PageObjects.observabilityLogExplorer.navigateTo({
          pageState: {
            datasetSelection: azureActivityDatasetSelection,
          },
        });
        const azureDatasetSelectionTitle =
          await PageObjects.observabilityLogExplorer.getDatasetSelectorButtonText();
        expect(azureDatasetSelectionTitle).to.be('[Azure Logs] activitylogs');

        // Go back to previous page selection
        await retry.tryForTime(30 * 1000, async () => {
          await browser.goBack();
          const backNavigationDatasetSelectionTitle =
            await PageObjects.observabilityLogExplorer.getDatasetSelectorButtonText();
          expect(backNavigationDatasetSelectionTitle).to.be('All logs');
        });
        // Go forward to previous page selection
        await retry.tryForTime(30 * 1000, async () => {
          await browser.goForward();
          const forwardNavigationDatasetSelectionTitle =
            await PageObjects.observabilityLogExplorer.getDatasetSelectorButtonText();
          expect(forwardNavigationDatasetSelectionTitle).to.be('[Azure Logs] activitylogs');
        });
      });
    });
  });
}
