import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ReactNode } from 'react';
import ChartTooltip from './ChartTooltip';
import { GRID, SERIES, axisProps } from './chartTheme';
import { formatNumber } from '../../utils/format';

interface BarsChartProps<T> {
  data: T[];
  /** Campo do rótulo de cada barra (dia ou nome) */
  xKey: keyof T & string;
  yKey: keyof T & string;
  formatValue: (value: number, point: T) => ReactNode;
  /** 'vertical' = colunas (séries por dia); 'horizontal' = barras deitadas (rankings) */
  orientation?: 'vertical' | 'horizontal';
  formatX?: (value: string) => string;
  formatTooltipLabel?: (value: string) => string;
  height?: number;
  color?: string;
}

/** Barras de uma métrica só: até 24px de espessura, ponta arredondada de 4px, tooltip por barra. */
export default function BarsChart<T>({
  data,
  xKey,
  yKey,
  formatValue,
  orientation = 'vertical',
  formatX,
  formatTooltipLabel,
  height = 260,
  color = SERIES[0],
}: BarsChartProps<T>) {
  const horizontal = orientation === 'horizontal';
  const tooltip = (
    <Tooltip
      cursor={{ fill: 'rgba(16, 102, 231, 0.06)' }}
      content={(props) => (
        <ChartTooltip
          active={props.active}
          label={props.label as string}
          payload={props.payload as never}
          formatLabel={formatTooltipLabel ?? formatX}
          formatValue={(v, p) => formatValue(v, p as T)}
        />
      )}
    />
  );

  if (horizontal) {
    // Ranking: rótulos à esquerda, valor na ponta da barra
    const barHeight = Math.max(height, data.length * 40 + 16);
    return (
      <ResponsiveContainer width="100%" height={barHeight}>
        <BarChart data={data as unknown as Record<string, unknown>[]} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" allowDecimals={false} tickFormatter={formatNumber} {...axisProps} />
          <YAxis
            type="category"
            dataKey={xKey as string}
            width={170}
            tickFormatter={formatX}
            {...axisProps}
            axisLine={false}
          />
          {tooltip}
          <Bar dataKey={yKey as string} fill={color} maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey={yKey as string} position="right" formatter={(v) => formatNumber(Number(v))} className="bar-label" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data as unknown as Record<string, unknown>[]} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey as string} tickFormatter={formatX} minTickGap={16} {...axisProps} />
        <YAxis allowDecimals={false} width={44} tickFormatter={formatNumber} {...axisProps} axisLine={false} />
        {tooltip}
        <Bar dataKey={yKey as string} fill={color} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
