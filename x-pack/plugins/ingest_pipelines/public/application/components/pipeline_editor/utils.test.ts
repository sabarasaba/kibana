/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getValue, setValue, isTemplateSnippet } from './utils';

describe('get and set values', () => {
  const testObject = Object.freeze([{ onFailure: [{ onFailure: 1 }] }]);
  describe('#getValue', () => {
    it('gets a deeply nested value', () => {
      expect(getValue(['0', 'onFailure', '0', 'onFailure'], testObject)).toBe(1);
    });

    it('empty array for path returns "root" value', () => {
      const result = getValue([], testObject);
      expect(result).toEqual(testObject);
      // Getting does not create a copy
      expect(result).toBe(testObject);
    });
  });

  describe('#setValue', () => {
    it('sets a deeply nested value', () => {
      const result = setValue(['0', 'onFailure', '0', 'onFailure'], testObject, 2);
      expect(result).toEqual([{ onFailure: [{ onFailure: 2 }] }]);
      expect(result).not.toBe(testObject);
    });

    it('returns value if no path was provided', () => {
      setValue([], testObject, 2);
      expect(testObject).toEqual([{ onFailure: [{ onFailure: 1 }] }]);
    });
  });
});

describe('template strings', () => {
  it('knows when a string contains an invalid template snippet', () => {
    expect(isTemplateSnippet('{}')).toBe(false);
    expect(isTemplateSnippet('{{{}}}')).toBe(false);
    expect(isTemplateSnippet('{{hello}}')).toBe(false);
    expect(isTemplateSnippet('hello{{{world}}}')).toBe(false);
    expect(isTemplateSnippet('{{{hello}}}world')).toBe(false);
  });

  it('knows when a string contains a valid template snippet', () => {
    expect(isTemplateSnippet('{{{hello}}}')).toBe(true);
    expect(isTemplateSnippet('{{{hello.world}}}')).toBe(true);
  });
});
