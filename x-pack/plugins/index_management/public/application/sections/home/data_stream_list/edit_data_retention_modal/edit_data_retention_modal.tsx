/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiButtonEmpty,
  EuiButton,
  EuiSpacer,
  EuiLink,
  EuiText,
  EuiBadge,
  EuiCallOut,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  useForm,
  useFormData,
  useFormIsModified,
  Form,
  fieldFormatters,
  FormSchema,
  FIELD_TYPES,
  UseField,
  ToggleField,
  NumericField,
} from '../../../../../shared_imports';

import { documentationService } from '../../../../services/documentation';
import { splitSizeAndUnits, DataStream } from '../../../../../../common';
import { isDataStreamUnmanaged, isDSLWithILMIndices } from '../../../../lib/data_streams';
import { useAppContext } from '../../../../app_context';
import { UnitField } from './unit_field';
import { updateDataRetention } from '../../../../services/api';

interface Props {
  dataStream: DataStream;
  ilmPolicyLink: string;
  onClose: (data?: { hasUpdatedDataRetention: boolean }) => void;
}

export const timeUnits = [
  {
    value: 'd',
    text: i18n.translate(
      'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.timeUnits.daysLabel',
      {
        defaultMessage: 'days',
      }
    ),
  },
  {
    value: 'h',
    text: i18n.translate(
      'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.timeUnits.hoursLabel',
      {
        defaultMessage: 'hours',
      }
    ),
  },
  {
    value: 'm',
    text: i18n.translate(
      'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.timeUnits.minutesLabel',
      {
        defaultMessage: 'minutes',
      }
    ),
  },
  {
    value: 's',
    text: i18n.translate(
      'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.timeUnits.secondsLabel',
      {
        defaultMessage: 'seconds',
      }
    ),
  },
];

const configurationFormSchema: FormSchema = {
  dataRetention: {
    type: FIELD_TYPES.TEXT,
    label: i18n.translate(
      'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.dataRetentionField',
      {
        defaultMessage: 'Data retention',
      }
    ),
    formatters: [fieldFormatters.toInt],
    validations: [
      {
        validator: ({ value, formData }) => {
          // If infiniteRetentionPeriod is set, we dont need to validate the data retention field
          if (formData.infiniteRetentionPeriod) {
            return undefined;
          }

          if (!value) {
            return {
              message: i18n.translate(
                'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.dataRetentionFieldRequiredError',
                {
                  defaultMessage: 'A data retention value is required.',
                }
              ),
            };
          }
          if (value <= 0) {
            return {
              message: i18n.translate(
                'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.dataRetentionFieldNonNegativeError',
                {
                  defaultMessage: `A positive value is required.`,
                }
              ),
            };
          }
        },
      },
    ],
  },
  timeUnit: {
    type: FIELD_TYPES.TEXT,
    label: i18n.translate(
      'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.timeUnitField',
      {
        defaultMessage: 'Time unit',
      }
    ),
  },
  infiniteRetentionPeriod: {
    type: FIELD_TYPES.TOGGLE,
    defaultValue: false,
    label: i18n.translate(
      'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.infiniteRetentionPeriodField',
      {
        defaultMessage: 'Keep data indefinitely',
      }
    ),
  },
};

export const EditDataRetentionModal: React.FunctionComponent<Props> = ({
  dataStream,
  ilmPolicyLink,
  onClose,
}) => {
  const lifecycle = dataStream?.lifecycle;
  const dataStreamName = dataStream?.name as string;
  const dataStreamManagedBy = dataStream?.nextGenerationManagedBy;
  const hasIlmPolicyWithDeletePhase = dataStream?.hasIlmPolicyWithDeletePhase;

  const dslWithIlmIndices = isDSLWithILMIndices(dataStream);
  const { size, unit } = splitSizeAndUnits(lifecycle?.data_retention as string);
  const {
    services: { notificationService },
  } = useAppContext();

  const { form } = useForm({
    defaultValue: {
      dataRetention: size,
      timeUnit: unit || 'd',
      // When data retention is not set and lifecycle is enabled, is the only scenario in
      // which data retention will be infinite. If lifecycle isnt set or is not enabled, we
      // dont have inifinite data retention.
      infiniteRetentionPeriod: lifecycle?.enabled && !lifecycle?.data_retention,
    },
    schema: configurationFormSchema,
    id: 'editDataRetentionForm',
  });
  const [formData] = useFormData({ form });
  const isDirty = useFormIsModified({ form });

  const onSubmitForm = async () => {
    const { isValid, data } = await form.submit();

    if (!isValid) {
      return;
    }

    return updateDataRetention(dataStreamName, data).then(({ data: responseData, error }) => {
      if (responseData) {
        const successMessage = i18n.translate(
          'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.successDataRetentionNotification',
          { defaultMessage: 'Data retention updated' }
        );
        notificationService.showSuccessToast(successMessage);

        return onClose({ hasUpdatedDataRetention: true });
      }

      if (error) {
        const errorMessage = i18n.translate(
          'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.errorDataRetentionNotification',
          {
            defaultMessage: "Error updating data retention: '{error}'",
            values: { error: error.message },
          }
        );
        notificationService.showDangerToast(errorMessage);
      }

      onClose();
    });
  };

  return (
    <EuiModal onClose={() => onClose()} data-test-subj="editDataRetentionModal">
      <Form form={form} data-test-subj="editDataRetentionForm">
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <FormattedMessage
              id="xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.modalTitleText"
              defaultMessage="Edit data retention"
            />{' '}
            <EuiBadge color="hollow">
              <EuiText size="xs">
                {i18n.translate(
                  'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.techPreviewLabel',
                  {
                    defaultMessage: 'Technical preview',
                  }
                )}
              </EuiText>
            </EuiBadge>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          {dslWithIlmIndices && (
            <>
              <EuiCallOut
                title={i18n.translate(
                  'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.someManagedByILMTitle',
                  { defaultMessage: 'Some indices are managed by ILM' }
                )}
                color="warning"
                iconType="warning"
                data-test-subj="someIndicesAreManagedByILMCallout"
              >
                <p>
                  <FormattedMessage
                    id="xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.someManagedByILMBody"
                    defaultMessage="The following indices are managed by ILM: {managedByILM}. Updating data retention will not affect these indices, instead you will have to update the {ilmPolicyLink}."
                    values={{
                      managedByILM: (
                        <strong>
                          {dslWithIlmIndices.ilmIndices.map((index) => index.name).join(', ')}
                        </strong>
                      ),
                      ilmPolicyLink: (
                        <EuiLink href={ilmPolicyLink}>
                          <FormattedMessage
                            id="xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.someManagedByILMLink"
                            defaultMessage="ILM policy"
                          />
                        </EuiLink>
                      ),
                    }}
                  />
                </p>
              </EuiCallOut>

              <EuiSpacer />
            </>
          )}

          {isDataStreamUnmanaged(dataStreamManagedBy) && (
            <>
              <EuiCallOut
                title={i18n.translate(
                  'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.unamangedDataStreamTitle',
                  { defaultMessage: 'This data stream is currently unmanaged' }
                )}
                color="warning"
                iconType="warning"
                data-test-subj="unamangedDataStreamCallout"
              >
                <p>
                  <FormattedMessage
                    id="xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.unamangedDataStreamBody"
                    defaultMessage="Configuring data retention will enable lifecycle for this data stream."
                  />
                </p>
              </EuiCallOut>

              <EuiSpacer />
            </>
          )}

          {hasIlmPolicyWithDeletePhase && (
            <>
              <EuiCallOut
                title={i18n.translate(
                  'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.hasIlmPolicyWithDeletePhaseTitle',
                  { defaultMessage: 'This data stream is managed by an ILM policy' }
                )}
                color="warning"
                iconType="warning"
                data-test-subj="hasIlmPolicyWithDeletePhaseCallout"
              >
                <p>
                  <FormattedMessage
                    id="xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.hasIlmPolicyWithDeletePhaseBody"
                    defaultMessage="Keeping data indefinitely is disabled because this data stream is managed by an ILM policy with a delete phase."
                  />
                </p>
              </EuiCallOut>

              <EuiSpacer />
            </>
          )}
          <UseField
            path="dataRetention"
            component={NumericField}
            labelAppend={
              <EuiText size="xs">
                <EuiLink href={documentationService.getUpdateExistingDS()} target="_blank" external>
                  {i18n.translate(
                    'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.learnMoreLinkText',
                    {
                      defaultMessage: 'How does it work?',
                    }
                  )}
                </EuiLink>
              </EuiText>
            }
            componentProps={{
              fullWidth: false,
              euiFieldProps: {
                disabled: hasIlmPolicyWithDeletePhase ? false : formData.infiniteRetentionPeriod,
                'data-test-subj': `dataRetentionValue`,
                min: 1,
                append: (
                  <UnitField
                    path="timeUnit"
                    options={timeUnits}
                    disabled={
                      hasIlmPolicyWithDeletePhase ? false : formData.infiniteRetentionPeriod
                    }
                    euiFieldProps={{
                      'data-test-subj': 'timeUnit',
                      'aria-label': i18n.translate(
                        'xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.unitsAriaLabel',
                        {
                          defaultMessage: 'Time unit',
                        }
                      ),
                    }}
                  />
                ),
              },
            }}
          />

          <UseField
            path="infiniteRetentionPeriod"
            component={ToggleField}
            data-test-subj="infiniteRetentionPeriod"
            componentProps={{
              euiFieldProps: {
                disabled: hasIlmPolicyWithDeletePhase,
              },
            }}
          />

          <EuiSpacer />
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty data-test-subj="cancelButton" onClick={() => onClose()}>
            <FormattedMessage
              id="xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.cancelButtonLabel"
              defaultMessage="Cancel"
            />
          </EuiButtonEmpty>

          <EuiButton
            fill
            type="submit"
            isLoading={false}
            disabled={(form.isSubmitted && form.isValid === false) || !isDirty}
            data-test-subj="saveButton"
            onClick={onSubmitForm}
          >
            <FormattedMessage
              id="xpack.idxMgmt.dataStreamsDetailsPanel.editDataRetentionModal.saveButtonLabel"
              defaultMessage="Save"
            />
          </EuiButton>
        </EuiModalFooter>
      </Form>
    </EuiModal>
  );
};
