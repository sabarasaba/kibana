/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Execution Event Schema
 *   version: not applicable
 */

import { z } from '@kbn/zod';

export type LogLevel = z.infer<typeof LogLevel>;
export const LogLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error']);
export type LogLevelEnum = typeof LogLevel.enum;
export const LogLevelEnum = LogLevel.enum;

/**
  * Type of a plain rule execution event:
- message: Simple log message of some log level, such as debug, info or error.
- status-change: We log an event of this type each time a rule changes its status during an execution.
- execution-metrics: We log an event of this type at the end of a rule execution. It contains various execution metrics such as search and indexing durations.
  */
export type RuleExecutionEventType = z.infer<typeof RuleExecutionEventType>;
export const RuleExecutionEventType = z.enum(['message', 'status-change', 'execution-metrics']);
export type RuleExecutionEventTypeEnum = typeof RuleExecutionEventType.enum;
export const RuleExecutionEventTypeEnum = RuleExecutionEventType.enum;

/**
  * Plain rule execution event. A rule can write many of them during each execution. Events can be of different types and log levels.

NOTE: This is a read model of rule execution events and it is pretty generic. It contains only a subset of their fields: only those fields that are common to all types of execution events.
  */
export type RuleExecutionEvent = z.infer<typeof RuleExecutionEvent>;
export const RuleExecutionEvent = z.object({
  timestamp: z.string().datetime(),
  sequence: z.number().int(),
  level: LogLevel,
  type: RuleExecutionEventType,
  execution_id: z.string().min(1),
  message: z.string(),
});
