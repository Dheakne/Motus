import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ReactNode } from 'react';
import ChartTooltip from './ChartTooltip';
import { GRID, SERIES, axisProps } from './chartTheme';
import { formatDayLong, formatDayShort, formatNumber } from '../../utils/format';

interface TrendChartProps<T> {
  data: T[];
  /** Campo com o dia "YYYY-MM-DD" */
  xKey: keyof T & string;
  yKey: keyof T & string;
  formatValue: (value: number, point: T) => ReactNode;
  height?: number;
}

/** Série temporal de uma métrica só: linha de 2px + área a 10%, crosshair e tooltip. */
export default function TrendChart<T>({ data, xKey, yKey, formatValue, height = 260 }: TrendChartProps<T>) {
  const color = SERIES[0];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data as unknown as Record<string, unknown>[]} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey as string} tickFormatter={formatDayShort} minTickGap={24} {...axisProps} />
        <YAxis allowDecimals={false} width={44} tickFormatter={formatNumber} {...axisProps} axisLine={false} />
        <Tooltip
          cursor={{ stroke: GRID, strokeWidth: 1 }}
          content={(props) => (
            <ChartTooltip
              active={props.active}
              label={props.label as string}
              payload={props.payload as never}
              formatLabel={formatDayLong}
              formatValue={(v, p) => formatValue(v, p as T)}
            />
          )}
        />
        <Area
          type="monotone"
          dataKey={yKey as string}
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.1}
          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: color }}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
