import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function useThemeColors() {
  return useMemo(
    () => ({
      accent: cssVar("--accent", "#1d4ed8"),
      accentWeak: cssVar("--accent-weak", "#eff6ff"),
      text: cssVar("--text", "#111827"),
      muted: cssVar("--muted", "#6b7280"),
      border: cssVar("--border", "#e5e7eb"),
    }),
    []
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function withAlpha(color: string, alpha: number) {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function BarChart(props: {
  title?: string;
  labels: string[];
  values: number[];
  height?: number;
}) {
  const colors = useThemeColors();
  const height = props.height ?? 280;

  return (
    <div className="chart" style={{ height }} aria-label={props.title ?? "Bar chart"}>
      <Bar
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: {
            x: { ticks: { color: colors.muted }, grid: { color: colors.border } },
            y: { ticks: { color: colors.muted }, grid: { color: colors.border } },
          },
        }}
        data={{
          labels: props.labels,
          datasets: [
            {
              label: props.title ?? "",
              data: props.values,
              backgroundColor: colors.accent,
              borderRadius: 10,
            },
          ],
        }}
      />
    </div>
  );
}

export function LineChart(props: {
  title?: string;
  labels: string[];
  values: number[];
  height?: number;
}) {
  const colors = useThemeColors();
  const height = props.height ?? 280;

  return (
    <div className="chart" style={{ height }} aria-label={props.title ?? "Line chart"}>
      <Line
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: {
            x: { ticks: { color: colors.muted }, grid: { color: colors.border } },
            y: { ticks: { color: colors.muted }, grid: { color: colors.border } },
          },
        }}
        data={{
          labels: props.labels,
          datasets: [
            {
              label: props.title ?? "",
              data: props.values,
              borderColor: colors.accent,
              backgroundColor: colors.accentWeak,
              fill: true,
              tension: 0.35,
              pointRadius: 2,
            },
          ],
        }}
      />
    </div>
  );
}

export function PieChart(props: {
  title?: string;
  labels: string[];
  values: number[];
  height?: number;
}) {
  const colors = useThemeColors();
  const height = props.height ?? 280;

  const palette = [
    withAlpha(colors.accent, 0.95),
    withAlpha(colors.accent, 0.75),
    withAlpha(colors.accent, 0.55),
    withAlpha(colors.accent, 0.35),
    withAlpha(colors.accent, 0.2),
  ];

  return (
    <div className="chart" style={{ height }} aria-label={props.title ?? "Pie chart"}>
      <Pie
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { enabled: true },
          },
        }}
        data={{
          labels: props.labels,
          datasets: [
            {
              label: props.title ?? "",
              data: props.values,
              backgroundColor: props.values.map((_, idx) => palette[idx % palette.length]),
              borderColor: colors.border,
              borderWidth: 1,
            },
          ],
        }}
      />
    </div>
  );
}

export function MiniSparkline(props: { labels: string[]; values: number[] }) {
  const colors = useThemeColors();
  return (
    <div className="chart" style={{ height: 120 }} aria-label="Trend sparkline">
      <Line
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
          elements: { line: { borderWidth: 2 }, point: { radius: 0 } },
        }}
        data={{
          labels: props.labels,
          datasets: [
            {
              data: props.values,
              borderColor: colors.accent,
              backgroundColor: colors.accentWeak,
              fill: true,
              tension: 0.35,
            },
          ],
        }}
      />
    </div>
  );
}
