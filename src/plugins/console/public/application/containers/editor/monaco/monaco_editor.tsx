/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { CSSProperties, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { css } from '@emotion/react';
import { CodeEditor } from '@kbn/code-editor';
import { CONSOLE_LANG_ID, CONSOLE_THEME_ID, monaco } from '@kbn/monaco';
import { i18n } from '@kbn/i18n';
import { useSetInputEditor } from '../../../hooks';
import { ContextMenu } from './components';
import {
  useServicesContext,
  useEditorReadContext,
  useRequestActionContext,
  useEditorActionContext,
} from '../../../contexts';
import { TextObject } from '../../../../../common/text_object';
import {
  useSetInitialValue,
  useSetupAutocompletePolling,
  useSetupAutosave,
  useResizeCheckerUtils,
  useKeyboardCommandsUtils,
} from './hooks';
import type { EditorRequest } from './types';
import { MonacoEditorActionsProvider } from './monaco_editor_actions_provider';
import { getSuggestionProvider } from './monaco_editor_suggestion_provider';

export interface EditorProps {
  initialTextValue: string;
}

export const MonacoEditor = ({ initialTextValue }: EditorProps) => {
  const context = useServicesContext();
  const {
    services: { notifications, settings: settingsService, autocompleteInfo },
    docLinkVersion,
    config: { isDevMode },
  } = context;
  const { toasts } = notifications;
  const {
    settings,
    currentTextObject,
    restoreRequestFromHistory: requestToRestoreFromHistory,
  } = useEditorReadContext();
  const [editorInstance, setEditorInstace] = useState<
    monaco.editor.IStandaloneCodeEditor | undefined
  >();

  const divRef = useRef<HTMLDivElement | null>(null);
  const { setupResizeChecker, destroyResizeChecker } = useResizeCheckerUtils();
  const { registerKeyboardCommands, unregisterKeyboardCommands } = useKeyboardCommandsUtils();

  const editorDispatch = useEditorActionContext();
  const dispatch = useRequestActionContext();
  const actionsProvider = useRef<MonacoEditorActionsProvider | null>(null);
  const [editorActionsCss, setEditorActionsCss] = useState<CSSProperties>({});

  const setInputEditor = useSetInputEditor();

  const getRequestsCallback = useCallback(async (): Promise<EditorRequest[]> => {
    const requests = await actionsProvider.current?.getRequests();
    return requests ?? [];
  }, []);

  const getDocumenationLink = useCallback(async () => {
    return actionsProvider.current!.getDocumentationLink(docLinkVersion);
  }, [docLinkVersion]);

  const autoIndentCallback = useCallback(async () => {
    return actionsProvider.current!.autoIndent();
  }, []);

  const sendRequestsCallback = useCallback(async () => {
    await actionsProvider.current?.sendRequests(dispatch, context);
  }, [dispatch, context]);

  const editorDidMountCallback = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      const provider = new MonacoEditorActionsProvider(editor, setEditorActionsCss, isDevMode);
      setInputEditor(provider);
      actionsProvider.current = provider;
      setupResizeChecker(divRef.current!, editor);
      setEditorInstace(editor);
    },
    [setupResizeChecker, setInputEditor, setEditorInstace, isDevMode]
  );

  useEffect(() => {
    if (settings.isKeyboardShortcutsEnabled && editorInstance) {
      registerKeyboardCommands({
        editor: editorInstance,
        sendRequest: sendRequestsCallback,
        autoIndent: async () => await actionsProvider.current?.autoIndent(),
        getDocumentationLink: getDocumenationLink,
        moveToPreviousRequestEdge: async () =>
          await actionsProvider.current?.moveToPreviousRequestEdge(),
        moveToNextRequestEdge: async () => await actionsProvider.current?.moveToNextRequestEdge(),
      });
    } else {
      unregisterKeyboardCommands();
    }
  }, [
    editorInstance,
    getDocumenationLink,
    sendRequestsCallback,
    registerKeyboardCommands,
    unregisterKeyboardCommands,
    settings.isKeyboardShortcutsEnabled,
  ]);

  const editorWillUnmountCallback = useCallback(() => {
    destroyResizeChecker();
    unregisterKeyboardCommands();
  }, [destroyResizeChecker, unregisterKeyboardCommands]);

  const suggestionProvider = useMemo(() => {
    return getSuggestionProvider(actionsProvider);
  }, []);
  const [value, setValue] = useState(initialTextValue);

  useSetInitialValue({ initialTextValue, setValue, toasts });

  useSetupAutocompletePolling({ autocompleteInfo, settingsService });

  useSetupAutosave({ value });

  // Always keep the currentTextObject in sync with the value in the editor
  // to avoid losing the text object when the user navigates away from the shell
  useEffect(() => {
    // Only update the currentTextObject if the value has changed and is not empty
    // This is to avoid setting the currentTextObject to the example text when
    // the user clears the editor.
    if (currentTextObject?.text !== value && value !== '') {
      const textObject = {
        ...currentTextObject,
        text: value,
        updatedAt: Date.now(),
      } as TextObject;
      editorDispatch({ type: 'setCurrentTextObject', payload: textObject });
    }
  }, [value, currentTextObject, editorDispatch]);

  // Restore the request from history if there is one
  const updateEditor = useCallback(async () => {
    if (requestToRestoreFromHistory) {
      editorDispatch({ type: 'clearRequestToRestore' });
      await actionsProvider.current?.appendRequestToEditor(
        requestToRestoreFromHistory,
        dispatch,
        context
      );
    }
  }, [requestToRestoreFromHistory, dispatch, context, editorDispatch]);

  useEffect(() => {
    updateEditor();
  }, [updateEditor]);

  return (
    <div
      css={css`
        width: 100%;
      `}
      ref={divRef}
      data-test-subj="consoleMonacoEditorContainer"
    >
      <EuiFlexGroup
        className="conApp__editorActions"
        id="ConAppEditorActions"
        gutterSize="xs"
        responsive={false}
        style={editorActionsCss}
        justifyContent="center"
        alignItems="center"
      >
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={i18n.translate('console.monaco.sendRequestButtonTooltipContent', {
              defaultMessage: 'Click to send request',
            })}
          >
            <EuiButtonIcon
              iconType="playFilled"
              onClick={sendRequestsCallback}
              data-test-subj="sendRequestButton"
              aria-label={i18n.translate('console.monaco.sendRequestButtonTooltipAriaLabel', {
                defaultMessage: 'Click to send request',
              })}
              iconSize={'s'}
            />
          </EuiToolTip>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <ContextMenu
            getRequests={getRequestsCallback}
            getDocumentation={getDocumenationLink}
            autoIndent={autoIndentCallback}
            notifications={notifications}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <CodeEditor
        dataTestSubj={'consoleMonacoEditor'}
        languageId={CONSOLE_LANG_ID}
        value={value}
        onChange={setValue}
        fullWidth={true}
        accessibilityOverlayEnabled={settings.isAccessibilityOverlayEnabled}
        editorDidMount={editorDidMountCallback}
        editorWillUnmount={editorWillUnmountCallback}
        options={{
          fontSize: settings.fontSize,
          wordWrap: settings.wrapMode === true ? 'on' : 'off',
          theme: CONSOLE_THEME_ID,
          // Make the quick-fix window be fixed to the window rather than clipped by
          // the parent content set with overflow: hidden/auto
          fixedOverflowWidgets: true,
        }}
        suggestionProvider={suggestionProvider}
        enableFindAction={true}
      />
    </div>
  );
};
