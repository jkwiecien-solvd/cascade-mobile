/**
 * CostPieChart — a donut chart of cost share by agent type, the mobile port of
 * the web client's `WorkItemCostChart` (`../cascade/web`). Hand-rolled on
 * `react-native-svg` (no charting dependency): each slice is an SVG arc `Path`,
 * with a background-colored hole drawn over the center to form the donut and the
 * total cost rendered in the middle.
 *
 * Purely presentational — `ProjectStats` derives values, colors, and formatted
 * strings (the `StatCard` "parent formats" idiom); this just draws.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** One slice: a positive cost `value`, its resolved `color`, and display copy. */
export type CostSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
  display: string;
};

type CostPieChartProps = {
  slices: CostSlice[];
  /** Pre-formatted total cost shown in the donut center (e.g. "$1.23"). */
  totalDisplay: string;
};

const SIZE = 180;
const STROKE = 32; // donut thickness
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

/** Point on the circle at `angleDeg` (0° = top, clockwise). */
function pointAt(angleDeg: number, r: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

/** SVG path for a filled wedge from center spanning [start, end] degrees. */
function wedgePath(startAngle: number, endAngle: number): string {
  const start = pointAt(endAngle, RADIUS + STROKE / 2);
  const end = pointAt(startAngle, RADIUS + STROKE / 2);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS + STROKE / 2} ${
    RADIUS + STROKE / 2
  } 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function CostPieChart({ slices, totalDisplay }: CostPieChartProps) {
  const theme = useTheme();
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <View style={styles.container}>
      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE}>
          <G>
            {total > 0 &&
              (() => {
                // Single slice covers the full circle — an arc with equal start
                // and end degenerates, so draw a ring instead.
                if (slices.length === 1) {
                  return (
                    <Circle
                      cx={CENTER}
                      cy={CENTER}
                      r={RADIUS + STROKE / 2}
                      fill={slices[0].color}
                    />
                  );
                }
                let angle = 0;
                return slices.map((slice) => {
                  const sweep = (slice.value / total) * 360;
                  const path = wedgePath(angle, angle + sweep);
                  angle += sweep;
                  return <Path key={slice.key} d={path} fill={slice.color} />;
                });
              })()}
            {/* Donut hole. */}
            <Circle cx={CENTER} cy={CENTER} r={RADIUS - STROKE / 2} fill={theme.background} />
          </G>
        </Svg>
        <View style={styles.centerLabel} pointerEvents="none">
          <ThemedText type="smallBold">{totalDisplay}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            total
          </ThemedText>
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.key} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: slice.color }]} />
            <ThemedText type="small" numberOfLines={1} style={styles.legendLabel}>
              {slice.label}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {slice.display}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  chartWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    alignSelf: 'stretch',
    gap: Spacing.one,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
  },
});
