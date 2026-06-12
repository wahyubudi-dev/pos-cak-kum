"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatRupiah } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/db/schema";

type ChartData = {
  day: string;
  orderCount: number;
  revenue: number;
};

type StatusData = {
  status: string;
  count: number;
};

type DashboardChartsProps = {
  barData: ChartData[];
  pieData: StatusData[];
};

const DAY_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

function abbreviate(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

const PIE_COLORS: Record<string, string> = {
  pending_confirmation: "#f59e0b",
  processing: "#3b82f6",
  ready: "#10b981",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

export function DashboardCharts({ barData, pieData }: DashboardChartsProps) {
  const chartData = barData.map((d) => ({
    ...d,
    label: DAY_FORMAT.format(new Date(d.day + "T00:00:00")),
  }));

  const hasBarData = barData.length > 0;
  const hasPieData = pieData.some((d) => d.count > 0);

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_280px]">
      {/* Bar Chart */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Pendapatan Harian</h2>
        {hasBarData ? (
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={10} margin={{ top: 8, right: 16, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={abbreviate}
                  width={48}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as ChartData & { label: string };
                    return (
                      <div className="rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-md text-xs">
                        <p className="mb-1 font-medium text-foreground">{label}</p>
                        <p className="text-muted-foreground">
                          Pesanan: <span className="font-semibold text-foreground">{row.orderCount}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Pendapatan:{" "}
                          <span className="font-semibold text-brand-teal">
                            {formatRupiah(row.revenue)}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#019d91"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-pearl py-16 text-sm text-muted-foreground">
            Belum ada data di rentang tanggal ini.
          </div>
        )}
      </section>

      {/* Pie Chart */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Status Pesanan</h2>
        {hasPieData ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.map((d) => ({ ...d, label: ORDER_STATUS_LABELS[d.status as OrderStatus] ?? d.status }))}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={PIE_COLORS[entry.status] ?? "#d1d5db"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-md text-xs">
                          <p className="font-medium text-foreground">{row.label}</p>
                          <p className="text-muted-foreground">
                            {row.count} pesanan
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              {pieData.filter((d) => d.count > 0).map((d) => (
                <div key={d.status} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[d.status] ?? "#d1d5db" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {ORDER_STATUS_LABELS[d.status as OrderStatus] ?? d.status}: <strong className="text-foreground">{d.count}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-pearl py-16 text-sm text-muted-foreground">
            Belum ada data.
          </div>
        )}
      </section>
    </div>
  );
}
