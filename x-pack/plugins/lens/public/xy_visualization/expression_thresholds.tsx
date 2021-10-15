/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import './expression_thresholds.scss';
import React from 'react';
import { groupBy } from 'lodash';
import { EuiIcon } from '@elastic/eui';
import { RectAnnotation, AnnotationDomainType, LineAnnotation, Position } from '@elastic/charts';
import type { PaletteRegistry } from 'src/plugins/charts/public';
import type { FieldFormat } from 'src/plugins/field_formats/common';
import { euiLightVars } from '@kbn/ui-shared-deps-src/theme';
import type { LayerArgs, YConfig } from '../../common/expressions';
import type { LensMultiTable } from '../../common/types';
import { hasIcon } from './xy_config_panel/threshold_panel';

const THRESHOLD_MARKER_SIZE = 20;

export const computeChartMargins = (
  thresholdPaddings: Partial<Record<Position, number>>,
  labelVisibility: Partial<Record<'x' | 'yLeft' | 'yRight', boolean>>,
  titleVisibility: Partial<Record<'x' | 'yLeft' | 'yRight', boolean>>,
  axesMap: Record<'left' | 'right', unknown>,
  isHorizontal: boolean
) => {
  const result: Partial<Record<Position, number>> = {};
  if (!labelVisibility?.x && !titleVisibility?.x && thresholdPaddings.bottom) {
    const placement = isHorizontal ? mapVerticalToHorizontalPlacement('bottom') : 'bottom';
    result[placement] = thresholdPaddings.bottom;
  }
  if (
    thresholdPaddings.left &&
    (isHorizontal || (!labelVisibility?.yLeft && !titleVisibility?.yLeft))
  ) {
    const placement = isHorizontal ? mapVerticalToHorizontalPlacement('left') : 'left';
    result[placement] = thresholdPaddings.left;
  }
  if (
    thresholdPaddings.right &&
    (isHorizontal || !axesMap.right || (!labelVisibility?.yRight && !titleVisibility?.yRight))
  ) {
    const placement = isHorizontal ? mapVerticalToHorizontalPlacement('right') : 'right';
    result[placement] = thresholdPaddings.right;
  }
  // there's no top axis, so just check if a margin has been computed
  if (thresholdPaddings.top) {
    const placement = isHorizontal ? mapVerticalToHorizontalPlacement('top') : 'top';
    result[placement] = thresholdPaddings.top;
  }
  return result;
};

// Note: it does not take into consideration whether the threshold is in view or not
export const getThresholdRequiredPaddings = (
  thresholdLayers: LayerArgs[],
  axesMap: Record<'left' | 'right', unknown>
) => {
  // collect all paddings for the 4 axis: if any text is detected double it.
  const paddings: Partial<Record<Position, number>> = {};
  const icons: Partial<Record<Position, number>> = {};
  thresholdLayers.forEach((layer) => {
    layer.yConfig?.forEach(({ axisMode, icon, iconPosition, textVisibility }) => {
      if (axisMode && (hasIcon(icon) || textVisibility)) {
        const placement = getBaseIconPlacement(iconPosition, axisMode, axesMap);
        paddings[placement] = Math.max(
          paddings[placement] || 0,
          THRESHOLD_MARKER_SIZE * (textVisibility ? 2 : 1) // double the padding size if there's text
        );
        icons[placement] = (icons[placement] || 0) + (hasIcon(icon) ? 1 : 0);
      }
    });
  });
  // post-process the padding based on the icon presence:
  // if no icon is present for the placement, just reduce the padding
  (Object.keys(paddings) as Position[]).forEach((placement) => {
    if (!icons[placement]) {
      paddings[placement] = THRESHOLD_MARKER_SIZE;
    }
  });

  return paddings;
};

function mapVerticalToHorizontalPlacement(placement: Position) {
  switch (placement) {
    case Position.Top:
      return Position.Right;
    case Position.Bottom:
      return Position.Left;
    case Position.Left:
      return Position.Bottom;
    case Position.Right:
      return Position.Top;
  }
}

// if there's just one axis, put it on the other one
// otherwise use the same axis
// this function assume the chart is vertical
function getBaseIconPlacement(
  iconPosition: YConfig['iconPosition'],
  axisMode: YConfig['axisMode'],
  axesMap: Record<string, unknown>
) {
  if (iconPosition === 'auto') {
    if (axisMode === 'bottom') {
      return Position.Top;
    }
    if (axisMode === 'left') {
      return axesMap.right ? Position.Left : Position.Right;
    }
    return axesMap.left ? Position.Right : Position.Left;
  }

  if (iconPosition === 'left') {
    return Position.Left;
  }
  if (iconPosition === 'right') {
    return Position.Right;
  }
  if (iconPosition === 'below') {
    return Position.Bottom;
  }
  return Position.Top;
}

function getMarkerBody(label: string | undefined, isHorizontal: boolean) {
  if (!label) {
    return;
  }
  if (isHorizontal) {
    return (
      <div className="eui-textTruncate" style={{ maxWidth: THRESHOLD_MARKER_SIZE * 3 }}>
        {label}
      </div>
    );
  }
  return (
    <div
      className="lnsXyDecorationRotatedWrapper"
      style={{
        width: THRESHOLD_MARKER_SIZE,
      }}
    >
      <div
        className="eui-textTruncate lnsXyDecorationRotatedWrapper__label"
        style={{
          maxWidth: THRESHOLD_MARKER_SIZE * 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function getMarkerToShow(
  yConfig: YConfig,
  label: string | undefined,
  isHorizontal: boolean,
  hasReducedPadding: boolean
) {
  // show an icon if present
  if (hasIcon(yConfig.icon)) {
    return <EuiIcon type={yConfig.icon} />;
  }
  // if there's some text, check whether to show it as marker, or just show some padding for the icon
  if (yConfig.textVisibility) {
    if (hasReducedPadding) {
      return getMarkerBody(
        label,
        (!isHorizontal && yConfig.axisMode === 'bottom') ||
          (isHorizontal && yConfig.axisMode !== 'bottom')
      );
    }
    return <EuiIcon type="empty" />;
  }
}

export const ThresholdAnnotations = ({
  thresholdLayers,
  data,
  formatters,
  paletteService,
  syncColors,
  axesMap,
  isHorizontal,
  thresholdPaddingMap,
}: {
  thresholdLayers: LayerArgs[];
  data: LensMultiTable;
  formatters: Record<'left' | 'right' | 'bottom', FieldFormat | undefined>;
  paletteService: PaletteRegistry;
  syncColors: boolean;
  axesMap: Record<'left' | 'right', boolean>;
  isHorizontal: boolean;
  thresholdPaddingMap: Partial<Record<Position, number>>;
}) => {
  return (
    <>
      {thresholdLayers.flatMap((thresholdLayer) => {
        if (!thresholdLayer.yConfig) {
          return [];
        }
        const { columnToLabel, yConfig: yConfigs, layerId } = thresholdLayer;
        const columnToLabelMap: Record<string, string> = columnToLabel
          ? JSON.parse(columnToLabel)
          : {};
        const table = data.tables[layerId];

        const row = table.rows[0];

        const yConfigByValue = yConfigs.sort(
          ({ forAccessor: idA }, { forAccessor: idB }) => row[idA] - row[idB]
        );

        const groupedByDirection = groupBy(yConfigByValue, 'fill');

        return yConfigByValue.flatMap((yConfig, i) => {
          // Find the formatter for the given axis
          const groupId =
            yConfig.axisMode === 'bottom'
              ? undefined
              : yConfig.axisMode === 'right'
              ? 'right'
              : 'left';

          const formatter = formatters[groupId || 'bottom'];

          const defaultColor = euiLightVars.euiColorDarkShade;

          // get the position for vertical chart
          const markerPositionVertical = getBaseIconPlacement(
            yConfig.iconPosition,
            yConfig.axisMode,
            axesMap
          );
          // the padding map is built for vertical chart
          const hasReducedPadding =
            thresholdPaddingMap[markerPositionVertical] === THRESHOLD_MARKER_SIZE;

          const props = {
            groupId,
            marker: getMarkerToShow(
              yConfig,
              columnToLabelMap[yConfig.forAccessor],
              isHorizontal,
              hasReducedPadding
            ),
            markerBody: getMarkerBody(
              yConfig.textVisibility && !hasReducedPadding
                ? columnToLabelMap[yConfig.forAccessor]
                : undefined,
              (!isHorizontal && yConfig.axisMode === 'bottom') ||
                (isHorizontal && yConfig.axisMode !== 'bottom')
            ),
            // rotate the position if required
            markerPosition: isHorizontal
              ? mapVerticalToHorizontalPlacement(markerPositionVertical)
              : markerPositionVertical,
          };
          const annotations = [];

          const dashStyle =
            yConfig.lineStyle === 'dashed'
              ? [(yConfig.lineWidth || 1) * 3, yConfig.lineWidth || 1]
              : yConfig.lineStyle === 'dotted'
              ? [yConfig.lineWidth || 1, yConfig.lineWidth || 1]
              : undefined;

          const sharedStyle = {
            strokeWidth: yConfig.lineWidth || 1,
            stroke: yConfig.color || defaultColor,
            dash: dashStyle,
          };

          annotations.push(
            <LineAnnotation
              {...props}
              id={`${layerId}-${yConfig.forAccessor}-line`}
              key={`${layerId}-${yConfig.forAccessor}-line`}
              dataValues={table.rows.map(() => ({
                dataValue: row[yConfig.forAccessor],
                header: columnToLabelMap[yConfig.forAccessor],
                details: formatter?.convert(row[yConfig.forAccessor]) || row[yConfig.forAccessor],
              }))}
              domainType={
                yConfig.axisMode === 'bottom'
                  ? AnnotationDomainType.XDomain
                  : AnnotationDomainType.YDomain
              }
              style={{
                line: {
                  ...sharedStyle,
                  opacity: 1,
                },
              }}
            />
          );

          if (yConfig.fill && yConfig.fill !== 'none') {
            const isFillAbove = yConfig.fill === 'above';
            const indexFromSameType = groupedByDirection[yConfig.fill].findIndex(
              ({ forAccessor }) => forAccessor === yConfig.forAccessor
            );
            const shouldCheckNextThreshold =
              indexFromSameType < groupedByDirection[yConfig.fill].length - 1;
            annotations.push(
              <RectAnnotation
                {...props}
                id={`${layerId}-${yConfig.forAccessor}-rect`}
                key={`${layerId}-${yConfig.forAccessor}-rect`}
                dataValues={table.rows.map(() => {
                  if (yConfig.axisMode === 'bottom') {
                    return {
                      coordinates: {
                        x0: isFillAbove ? row[yConfig.forAccessor] : undefined,
                        y0: undefined,
                        x1: isFillAbove
                          ? shouldCheckNextThreshold
                            ? row[
                                groupedByDirection[yConfig.fill!][indexFromSameType + 1].forAccessor
                              ]
                            : undefined
                          : row[yConfig.forAccessor],
                        y1: undefined,
                      },
                      header: columnToLabelMap[yConfig.forAccessor],
                      details:
                        formatter?.convert(row[yConfig.forAccessor]) || row[yConfig.forAccessor],
                    };
                  }
                  return {
                    coordinates: {
                      x0: undefined,
                      y0: isFillAbove ? row[yConfig.forAccessor] : undefined,
                      x1: undefined,
                      y1: isFillAbove
                        ? shouldCheckNextThreshold
                          ? row[
                              groupedByDirection[yConfig.fill!][indexFromSameType + 1].forAccessor
                            ]
                          : undefined
                        : row[yConfig.forAccessor],
                    },
                    header: columnToLabelMap[yConfig.forAccessor],
                    details:
                      formatter?.convert(row[yConfig.forAccessor]) || row[yConfig.forAccessor],
                  };
                })}
                style={{
                  ...sharedStyle,
                  fill: yConfig.color || defaultColor,
                  opacity: 0.1,
                }}
              />
            );
          }
          return annotations;
        });
      })}
    </>
  );
};
