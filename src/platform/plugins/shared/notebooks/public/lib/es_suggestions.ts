/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { monaco } from '@kbn/monaco';
import type { EsAutocompleteFacade } from '../types';

// ── es.method() context detection ────────────────────────────────────────────

interface UrlContext {
  kind: 'url';
  method: string;
  partialPath: string;
}

interface BodyContext {
  kind: 'body';
  method: string;
  path: string;
  bodyBeforeCursor: string;
}

type EsCallContext = UrlContext | BodyContext;

const ES_CALL_RE = /\bes\.(get|post|put|delete|head)\s*\(\s*/gi;

/**
 * Returns true if the brace content (text AFTER the opening `{`) is still open —
 * i.e. the object literal has not been closed before the cursor.
 */
function isInsideObject(afterOpenBrace: string): boolean {
  let depth = 1;
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < afterOpenBrace.length; i++) {
    const ch = afterOpenBrace[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) inString = false;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return false;
    }
  }
  return depth > 0;
}

/**
 * Scans textBeforeCursor backwards to detect if the cursor is inside
 * an es.method('path') string argument or es.method('path', {body}) body object.
 */
function detectEsCallContext(textBeforeCursor: string): EsCallContext | null {
  // Find the last es.method( occurrence before the cursor
  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  ES_CALL_RE.lastIndex = 0;
  while ((m = ES_CALL_RE.exec(textBeforeCursor)) !== null) {
    lastMatch = m;
  }
  if (!lastMatch) return null;

  const method = lastMatch[1];
  const afterParen = textBeforeCursor.slice(lastMatch.index + lastMatch[0].length);

  // Case 1: cursor is inside the first string argument (no closing quote after opening)
  // e.g. es.get('/_cluster/h|   or   es.get("/_cluster/h|
  const urlInProgress = afterParen.match(/^(['"`])([^'"`]*)$/s);
  if (urlInProgress) {
    return { kind: 'url', method, partialPath: urlInProgress[2] };
  }

  // Case 2: first arg is a complete string, cursor is inside the second arg body object
  // e.g. es.post('/index/_search', { query: { |
  const firstArgDone = afterParen.match(/^(['"`])([^'"`]*)['"`]\s*,\s*\{([\s\S]*)$/);
  if (firstArgDone) {
    const path = firstArgDone[2];
    const bodyAfterBrace = firstArgDone[3];
    if (isInsideObject(bodyAfterBrace)) {
      return { kind: 'body', method, path, bodyBeforeCursor: bodyAfterBrace };
    }
  }

  return null;
}

// ── static fallback completions ───────────────────────────────────────────────

const Kind = { Method: 0, Function: 2, Variable: 5, Keyword: 13, Snippet: 14 } as const;
const SNIPPET = 4;
type Item = monaco.languages.CompletionItem;

const KEYWORDS: Array<Omit<Item, 'range'>> = [
  'await', 'async', 'return', 'const', 'let', 'var',
  'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
  'new', 'this', 'throw', 'try', 'catch', 'finally',
  'break', 'continue', 'delete', 'void',
].map((kw) => ({ label: kw, kind: Kind.Keyword, insertText: kw }));

const SNIPPETS: Array<Omit<Item, 'range'>> = [
  { label: 'for...of', kind: Kind.Snippet, detail: 'for (const item of iterable)',
    insertText: 'for (const ${1:item} of ${2:items}) {\n  ${3}\n}', insertTextRules: SNIPPET },
  { label: 'if', kind: Kind.Snippet,
    insertText: 'if (${1:condition}) {\n  ${2}\n}', insertTextRules: SNIPPET },
  { label: 'try...catch', kind: Kind.Snippet,
    insertText: 'try {\n  ${1}\n} catch (err) {\n  console.error(err);\n}', insertTextRules: SNIPPET },
  { label: 'await es.get', kind: Kind.Snippet, detail: 'GET request',
    insertText: "await es.get(${1})", insertTextRules: SNIPPET },
  { label: 'await es.post', kind: Kind.Snippet, detail: 'POST request',
    insertText: "await es.post('${1:/index/_search}', {\n  ${2}\n})", insertTextRules: SNIPPET },
  { label: 'await es.put', kind: Kind.Snippet, detail: 'PUT request',
    insertText: "await es.put('${1:/index}', {\n  ${2}\n})", insertTextRules: SNIPPET },
  { label: 'await es.delete', kind: Kind.Snippet, detail: 'DELETE request',
    insertText: "await es.delete('${1:/index}')", insertTextRules: SNIPPET },
  { label: 'await es.head', kind: Kind.Snippet, detail: 'HEAD request — resolves boolean',
    insertText: "await es.head('${1:/index}')", insertTextRules: SNIPPET },
  { label: 'console.log', kind: Kind.Method,
    insertText: 'console.log(${1})', insertTextRules: SNIPPET },
  { label: 'console.error', kind: Kind.Method,
    insertText: 'console.error(${1})', insertTextRules: SNIPPET },
  { label: 'JSON.stringify', kind: Kind.Method,
    insertText: 'JSON.stringify(${1}, null, 2)', insertTextRules: SNIPPET },
  { label: 'JSON.parse', kind: Kind.Method,
    insertText: 'JSON.parse(${1})', insertTextRules: SNIPPET },
  { label: 'es', kind: Kind.Variable, detail: 'Elasticsearch client', insertText: 'es' },
];

function staticRange(position: monaco.Position, model: monaco.editor.ITextModel) {
  const word = model.getWordUntilPosition(position);
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: position.column,
  };
}

// ── main provider factory ─────────────────────────────────────────────────────

export function buildJsSuggestionProvider(
  facade?: EsAutocompleteFacade
): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['.', '/', "'", '"', ' '],
    async provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position
    ): Promise<monaco.languages.CompletionList> {
      // Gather all text up to the cursor for context detection
      const textBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const ctx = detectEsCallContext(textBeforeCursor);

      // URL path completions inside es.method('...')
      if (ctx?.kind === 'url' && facade) {
        try {
          return await facade.completeUrl(ctx.method, ctx.partialPath, model, position);
        } catch {
          // fall through to static completions
        }
      }

      // Body completions inside es.method('path', {...})
      if (ctx?.kind === 'body' && facade) {
        try {
          return await facade.completeBody(ctx.method, ctx.path, ctx.bodyBeforeCursor, model, position);
        } catch {
          // fall through to static completions
        }
      }

      // Static keyword + snippet completions (always available)
      if (ctx) return { suggestions: [] }; // inside es.* but no facade — don't pollute with keywords

      const range = staticRange(position, model);
      return {
        suggestions: [...KEYWORDS, ...SNIPPETS].map((item) => ({ ...item, range } as Item)),
      };
    },
  };
}
