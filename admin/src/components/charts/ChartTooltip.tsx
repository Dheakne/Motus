import type { ReactNode } from 'react';

interface TooltipEntry {
  value?: number | string;
  name?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  /** Título do tooltip a partir do label do eixo X */
  formatLabel?: (label: string) => string;
  /** Texto de cada linha: recebe o valor e o ponto completo */
  formatValue?: (value: number, point: Record<string, unknown>) => ReactNode;
}

/** Tooltip padrão: título + valores em cor de texto, com a cor da série só no marcador. */
export default function ChartTooltip({ active, label, payload, formatLabel, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const title = label == null ? '' : formatLabel ? formatLabel(String(label)) : String(label);

  return (
    <div className="chart-tooltip">
      {title && <div className="chart-tooltip-title">{title}</div>}
      {payload.map((entry, i) => (
        <div className="chart-tooltip-row" key={i}>
          <span className="chart-swatch" style={{ background: entry.color }} />
          <span>
            {formatValue
              ? formatValue(Number(entry.value), entry.payload ?? {})
              : `${entry.name}: ${entry.value}`}
          </span>
        </div>
      ))}
    </div>
  );
}
