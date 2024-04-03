/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiSpacer, EuiSwitch } from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { Processor } from '../../../../common/types';

import { getUseField, getFormRow, Field, JsonEditorField } from '../../../shared_imports';

import {
  ProcessorsEditorContextProvider,
  OnUpdateHandler,
  OnDoneLoadJsonHandler,
  PipelineEditor,
} from '../pipeline_editor';

interface Props {
  processors: Processor[];
  onFailure?: Processor[];
  onLoadJson: OnDoneLoadJsonHandler;
  onProcessorsUpdate: OnUpdateHandler;
  hasVersion: boolean;
  hasMeta: boolean;
  onEditorFlyoutOpen: () => void;
  isEditing?: boolean;
  canEditName?: boolean;
}

const UseField = getUseField({ component: Field });
const FormRow = getFormRow({ titleTag: 'h3' });

export const PipelineFormFields: React.FunctionComponent<Props> = ({
  processors,
  onFailure,
  onLoadJson,
  onProcessorsUpdate,
  hasVersion,
  hasMeta,
  onEditorFlyoutOpen,
}) => {
  const [isVersionVisible, setIsVersionVisible] = useState<boolean>(hasVersion);

  const [isMetaVisible, setIsMetaVisible] = useState<boolean>(hasMeta);

  return (
    <>
      {/* Name field with optional version field */}
      <FormRow
        title={
          <FormattedMessage
            id="xpack.ingestPipelines.form.versionNumber"
            defaultMessage="Version"
          />
        }
        description={
          <>
            <EuiSwitch
              label={
                <FormattedMessage
                  id="xpack.ingestPipelines.form.versionToggleDescription"
                  defaultMessage="Add version number"
                />
              }
              checked={isVersionVisible}
              onChange={(e) => setIsVersionVisible(e.target.checked)}
              data-test-subj="versionToggle"
            />
          </>
        }
      >
        {isVersionVisible && (
          <UseField
            path="version"
            componentProps={{
              ['data-test-subj']: 'versionField',
            }}
          />
        )}
      </FormRow>

      {/* Pipeline Processors Editor */}
      <ProcessorsEditorContextProvider
        onFlyoutOpen={onEditorFlyoutOpen}
        onUpdate={onProcessorsUpdate}
        value={{ processors, onFailure }}
      >
        <PipelineEditor onLoadJson={onLoadJson} />
      </ProcessorsEditorContextProvider>

      {/* _meta field */}
      <FormRow
        title={
          <FormattedMessage id="xpack.ingestPipelines.form.metaTitle" defaultMessage="Metadata" />
        }
        description={
          <>
            <FormattedMessage
              id="xpack.ingestPipelines.form.metaDescription"
              defaultMessage="Any additional information about the ingest pipeline. This information is stored in the cluster state, so best to keep it short."
            />

            <EuiSpacer size="m" />

            <EuiSwitch
              label={
                <FormattedMessage
                  id="xpack.ingestPipelines.form.metaSwitchCaption"
                  defaultMessage="Add metadata"
                />
              }
              checked={isMetaVisible}
              onChange={(e) => setIsMetaVisible(e.target.checked)}
              data-test-subj="metaToggle"
            />
          </>
        }
      >
        {isMetaVisible && (
          <UseField
            path="_meta"
            component={JsonEditorField}
            componentProps={{
              codeEditorProps: {
                'data-test-subj': 'metaEditor',
                height: '200px',
                'aria-label': i18n.translate('xpack.ingestPipelines.form.metaAriaLabel', {
                  defaultMessage: '_meta field data editor',
                }),
              },
            }}
          />
        )}
      </FormRow>
    </>
  );
};
