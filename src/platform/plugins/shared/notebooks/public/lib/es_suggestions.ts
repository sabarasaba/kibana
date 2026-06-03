/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { monaco } from '@kbn/monaco';

// CompletionItemKind values (avoid importing the enum directly)
const Kind = {
  Method: 0,
  Function: 2,
  Variable: 5,
  Keyword: 13,
  Snippet: 14,
  Property: 9,
} as const;

// InsertTextRules.InsertAsSnippet = 4
const SNIPPET = 4;

type Item = monaco.languages.CompletionItem;

// ── es client ──────────────────────────────────────────────────────────────

const ES_ITEMS: Array<Omit<Item, 'range'>> = [
  {
    label: 'es',
    kind: Kind.Variable,
    detail: 'Elasticsearch client',
    insertText: 'es',
    documentation: 'Injected Elasticsearch client. Methods: get, post, put, delete, head.',
  },
  {
    label: 'es.get',
    kind: Kind.Method,
    detail: 'es.get(path) → Promise<any>',
    insertText: "es.get('${1:/_cluster/health}')",
    insertTextRules: SNIPPET,
  },
  {
    label: 'es.post',
    kind: Kind.Method,
    detail: 'es.post(path, body?) → Promise<any>',
    insertText: "es.post('${1:/index/_search}', {\n  ${2}\n})",
    insertTextRules: SNIPPET,
  },
  {
    label: 'es.put',
    kind: Kind.Method,
    detail: 'es.put(path, body?) → Promise<any>',
    insertText: "es.put('${1:/index}', {\n  ${2}\n})",
    insertTextRules: SNIPPET,
  },
  {
    label: 'es.delete',
    kind: Kind.Method,
    detail: 'es.delete(path) → Promise<any>',
    insertText: "es.delete('${1:/index}')",
    insertTextRules: SNIPPET,
  },
  {
    label: 'es.head',
    kind: Kind.Method,
    detail: 'es.head(path) → Promise<boolean>',
    insertText: "es.head('${1:/index}')",
    insertTextRules: SNIPPET,
  },
];

// ── console ─────────────────────────────────────────────────────────────────

const CONSOLE_ITEMS: Array<Omit<Item, 'range'>> = [
  {
    label: 'console.log',
    kind: Kind.Method,
    insertText: 'console.log(${1})',
    insertTextRules: SNIPPET,
  },
  {
    label: 'console.warn',
    kind: Kind.Method,
    insertText: 'console.warn(${1})',
    insertTextRules: SNIPPET,
  },
  {
    label: 'console.error',
    kind: Kind.Method,
    insertText: 'console.error(${1})',
    insertTextRules: SNIPPET,
  },
];

// ── JSON ────────────────────────────────────────────────────────────────────

const JSON_ITEMS: Array<Omit<Item, 'range'>> = [
  {
    label: 'JSON.stringify',
    kind: Kind.Method,
    insertText: 'JSON.stringify(${1}, null, 2)',
    insertTextRules: SNIPPET,
  },
  {
    label: 'JSON.parse',
    kind: Kind.Method,
    insertText: 'JSON.parse(${1})',
    insertTextRules: SNIPPET,
  },
];

// ── keywords ─────────────────────────────────────────────────────────────────

const KEYWORDS = [
  'await', 'async', 'return', 'const', 'let', 'var',
  'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
  'new', 'this', 'throw', 'try', 'catch', 'finally',
  'break', 'continue', 'delete', 'void', 'yield',
].map((kw): Omit<Item, 'range'> => ({
  label: kw,
  kind: Kind.Keyword,
  insertText: kw,
}));

// ── snippets ─────────────────────────────────────────────────────────────────

const SNIPPETS: Array<Omit<Item, 'range'>> = [
  {
    label: 'for...of',
    kind: Kind.Snippet,
    detail: 'for (const item of iterable)',
    insertText: 'for (const ${1:item} of ${2:items}) {\n  ${3}\n}',
    insertTextRules: SNIPPET,
  },
  {
    label: 'if',
    kind: Kind.Snippet,
    insertText: 'if (${1:condition}) {\n  ${2}\n}',
    insertTextRules: SNIPPET,
  },
  {
    label: 'if...else',
    kind: Kind.Snippet,
    insertText: 'if (${1:condition}) {\n  ${2}\n} else {\n  ${3}\n}',
    insertTextRules: SNIPPET,
  },
  {
    label: 'try...catch',
    kind: Kind.Snippet,
    insertText: 'try {\n  ${1}\n} catch (err) {\n  console.error(err);\n}',
    insertTextRules: SNIPPET,
  },
  {
    label: 'async function',
    kind: Kind.Snippet,
    insertText: 'async function ${1:name}(${2}) {\n  ${3}\n}',
    insertTextRules: SNIPPET,
  },
  {
    label: 'await es.get — cluster health',
    kind: Kind.Snippet,
    insertText: "const ${1:health} = await es.get('/_cluster/health');\nconsole.log(${1:health}.status);",
    insertTextRules: SNIPPET,
  },
  {
    label: 'for...of with es.delete',
    kind: Kind.Snippet,
    detail: 'Delete a list of indices',
    insertText:
      "const ${1:indices} = ['${2:index-1}', '${3:index-2}'];\nfor (const idx of ${1:indices}) {\n  await es.delete(`/\\${idx}`);\n  console.log(idx, 'deleted');\n}",
    insertTextRules: SNIPPET,
  },
];

// ── provider ─────────────────────────────────────────────────────────────────

export function buildEsSuggestionProvider(): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['.'],
    provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position
    ): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);

      let pool: Array<Omit<Item, 'range'>>;

      if (linePrefix.endsWith('es.')) {
        pool = ES_ITEMS.filter((i) => (i.label as string).startsWith('es.'));
      } else if (linePrefix.endsWith('console.')) {
        pool = CONSOLE_ITEMS;
      } else if (linePrefix.endsWith('JSON.')) {
        pool = JSON_ITEMS;
      } else {
        pool = [...ES_ITEMS.filter((i) => i.label === 'es'), ...KEYWORDS, ...SNIPPETS];
      }

      return {
        suggestions: pool.map((item) => ({ ...item, range } as Item)),
      };
    },
  };
}
