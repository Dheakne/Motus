// Cores dos gráficos, validadas (contraste e daltonismo) com o validador do skill de dataviz.
// Série principal = azul primário do app; segunda série = verde escuro da marca.
export const SERIES = ['#1066E7', '#13A05E'] as const;

export const GRID = '#E5E5EA';
export const AXIS_TEXT = '#6E6E73';

export const axisProps = {
  tick: { fill: AXIS_TEXT, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: GRID },
} as const;
