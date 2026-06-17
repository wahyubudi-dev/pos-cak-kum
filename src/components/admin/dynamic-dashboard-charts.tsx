"use client";

import dynamic from "next/dynamic";
import { DashboardChartSkeleton } from "@/components/ui/skeleton";
import type { DashboardChartsProps } from "@/components/admin/dashboard-charts";

const Charts = dynamic(
  () =>
    import("@/components/admin/dashboard-charts").then((m) => ({
      default: m.DashboardCharts,
    })),
  { ssr: false, loading: () => <DashboardChartSkeleton /> },
);

export function DynamicDashboardCharts(props: DashboardChartsProps) {
  return <Charts {...props} />;
}
