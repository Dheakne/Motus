import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Moldura dos gráficos: o título diz o que está plotado (série única dispensa legenda). */
export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <section className="chart-card">
      <header className="chart-card-header">
        <h3>{title}</h3>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
