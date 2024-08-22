/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { sendRequest, XJson } from '@kbn/es-ui-shared-plugin/public';

const { collapseLiteralStrings, expandLiteralStrings } = XJson;

export { sendRequest, collapseLiteralStrings, expandLiteralStrings };

export { KibanaThemeProvider } from '@kbn/react-kibana-context-theme';

export { toMountPoint } from '@kbn/react-kibana-mount';

export {
  useForm,
  Form,
  UseField,
} from '@kbn/es-ui-shared-plugin/static/forms/hook_form_lib';

export type {
  FieldConfig,
  FormConfig,
} from '@kbn/es-ui-shared-plugin/static/forms/hook_form_lib';

export { fieldValidators } from '@kbn/es-ui-shared-plugin/static/forms/helpers';

export {
  TextField,
} from '@kbn/es-ui-shared-plugin/static/forms/components';
