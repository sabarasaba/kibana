/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent } from 'react';
import { i18n } from '@kbn/i18n';

import {
  FIELD_TYPES,
  UseField,
  UseArray,
  fieldValidators,
  ValidationFunc,
  ArrayItem,
} from '../../../../../../shared_imports';

import { XJsonEditor, DragAndDropTextList } from '../field_components';

import { FieldNameField } from './common_fields/field_name_field';
import { IgnoreMissingField } from './common_fields/ignore_missing_field';
import { FieldsConfig, to, from, EDITOR_PX_HEIGHT } from './shared';

const { isJsonField, emptyField } = fieldValidators;

const i18nTexts = {
  addPatternLabel: i18n.translate(
    'xpack.ingestPipelines.pipelineEditor.redactForm.patternsAddPatternLabel',
    { defaultMessage: 'Add pattern' }
  ),
};

const valueRequiredMessage = i18n.translate(
  'xpack.ingestPipelines.pipelineEditor.redactForm.patternsValueRequiredError',
  { defaultMessage: 'A value is required.' }
);

const patternsValidation: ValidationFunc<any, string, ArrayItem[]> = ({ value }) => {
  if (value.length === 0) {
    return {
      message: valueRequiredMessage,
    };
  }
};

const patternValidations: Array<ValidationFunc<any, string, string>> = [
  emptyField(valueRequiredMessage),
];

const fieldsConfig: FieldsConfig = {
  /* Required field configs */
  patterns: {
    label: i18n.translate('xpack.ingestPipelines.pipelineEditor.redactForm.patternsFieldLabel', {
      defaultMessage: 'Patterns',
    }),
    deserializer: String,
    helpText: i18n.translate('xpack.ingestPipelines.pipelineEditor.redactForm.patternsHelpText', {
      defaultMessage: 'A list of grok expressions to match and redact named captures with.',
    }),
    validations: [
      {
        validator: patternsValidation as ValidationFunc,
      },
    ],
  },
  /* Optional field configs */
  pattern_definitions: {
    type: FIELD_TYPES.TEXT,
    deserializer: to.jsonString,
    serializer: from.optionalJson,
    label: i18n.translate(
      'xpack.ingestPipelines.pipelineEditor.redactForm.patternDefinitionsLabel',
      {
        defaultMessage: 'Pattern definitions (optional)',
      }
    ),
    helpText: i18n.translate(
      'xpack.ingestPipelines.pipelineEditor.redactForm.patternDefinitionsHelpText',
      {
        defaultMessage:
          'A map of pattern-name and pattern tuples defining custom patterns to be used by the processor. Patterns matching existing names will override the pre-existing definition.',
      }
    ),
    validations: [
      {
        validator: isJsonField(
          i18n.translate(
            'xpack.ingestPipelines.pipelineEditor.redactForm.patternsDefinitionsInvalidJSONError',
            { defaultMessage: 'Invalid JSON' }
          ),
          {
            allowEmptyString: true,
          }
        ),
      },
    ],
  },
};

export const Redact: FunctionComponent = () => {
  return (
    <>
      <FieldNameField
        helpText={i18n.translate(
          'xpack.ingestPipelines.pipelineEditor.redactForm.fieldNameHelpText',
          { defaultMessage: 'Field to be redacted.' }
        )}
      />

      <UseArray path="fields.patterns" validations={fieldsConfig.patterns.validations}>
        {({ items, addItem, removeItem, moveItem, error }) => {
          return (
            <DragAndDropTextList
              label={fieldsConfig.patterns.label!}
              helpText={fieldsConfig.patterns.helpText}
              error={error}
              value={items}
              onMove={moveItem}
              onAdd={addItem}
              onRemove={removeItem}
              addLabel={i18nTexts.addPatternLabel}
              textValidations={patternValidations}
              textDeserializer={fieldsConfig.patterns?.deserializer}
              textSerializer={fieldsConfig.patterns?.serializer}
            />
          );
        }}
      </UseArray>

      <UseField
        component={XJsonEditor}
        config={fieldsConfig.pattern_definitions}
        componentProps={{
          editorProps: {
            height: EDITOR_PX_HEIGHT.medium,
            'aria-label': i18n.translate(
              'xpack.ingestPipelines.pipelineEditor.redactForm.patternDefinitionsAriaLabel',
              {
                defaultMessage: 'Pattern definitions editor',
              }
            ),
          },
        }}
        path="fields.pattern_definitions"
      />

      <IgnoreMissingField />
    </>
  );
};
