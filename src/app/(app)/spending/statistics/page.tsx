"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/providers/profile-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/lib/hooks/use-currency";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { categoryChartColors } from "@/lib/colors";
import type { Purchase } from "@/lib/types";

const CHART_COLORS = ["#64748b", "#b45309", "#7c3aed", "#0ea5e9", "#22c55e"];

const chartConfig = {
  amount: { label: "Amount", color: "var(--chart-1)" },
  vending: { label: "Vending", color: "#64748b" },
  coffee: { label: "Coffee", color: "#b45309" },
  other: { label: "Other", color: "#7c3aed" },
} satisfies ChartConfig;

export default function StatisticsPage() {
  const { activeProfile } = useProfile();
  const currency = useCurrency();
  const { locale } = useDateFormat();
  const supabase = createClient();
  const profileId = activeProfile?.id;

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases-all", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase
        .from("purchases")
        .select("*")
        .eq("profile_id", profileId)
        .order("purchased_at", { ascending: true });
      return (data as Purchase[]) || [];
    },
    enabled: !!profileId,
  });

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTotal = purchases
      .filter((p) => new Date(p.purchased_at).toDateString() === today)
      .reduce((s, p) => s + Number(p.price), 0);

    const weekTotal = purchases
      .filter((p) => new Date(p.purchased_at) >= weekAgo)
      .reduce((s, p) => s + Number(p.price), 0);

    const monthTotal = purchases
      .filter((p) => new Date(p.purchased_at) >= monthStart)
      .reduce((s, p) => s + Number(p.price), 0);

    const allTotal = purchases.reduce((s, p) => s + Number(p.price), 0);

    return { todayTotal, weekTotal, monthTotal, allTotal };
  }, [purchases]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + Number(p.price);
    });
    // Fixed order: vending, coffee, other (then any extras alphabetically)
    const order = ["vending", "coffee", "other"];
    return Object.entries(map)
      .sort(([a], [b]) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.localeCompare(b);
      })
      .map(([name, value]) => ({ name, value }));
  }, [purchases]);

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    const last14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    purchases
      .filter((p) => new Date(p.purchased_at) >= last14)
      .forEach((p) => {
        const day = new Date(p.purchased_at).toLocaleDateString(locale ?? undefined, {
          month: "short",
          day: "numeric",
        });
        map[day] = (map[day] || 0) + Number(p.price);
      });
    return Object.entries(map).map(([day, amount]) => ({ day, amount }));
  }, [purchases, locale]);

  const topItems = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    purchases.forEach((p) => {
      if (!map[p.item_name]) map[p.item_name] = { count: 0, total: 0 };
      map[p.item_name].count++;
      map[p.item_name].total += Number(p.price);
    });
    return Object.entries(map)
      .map(([name, { count, total }]) => ({ name, count, total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [purchases]);

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Select a profile first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8" asChild aria-label="Back to spending">
          <Link href="/spending">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Spending Statistics</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-lg font-bold">{formatCurrency(stats.todayTotal, currency, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-lg font-bold">{formatCurrency(stats.weekTotal, currency, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-lg font-bold">{formatCurrency(stats.monthTotal, currency, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">All Time</p>
            <p className="text-lg font-bold">{formatCurrency(stats.allTotal, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily spending chart */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Spending (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={10} tickLine={false} />
                <YAxis fontSize={10} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="mx-auto h-[200px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={categoryChartColors[entry.name] ?? CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: categoryChartColors[cat.name] ?? CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-xs font-medium capitalize">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(cat.value, currency, locale)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top items */}
      {topItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Most Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{item.count}x</span>
                    <span className="font-medium">{formatCurrency(item.total, currency, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
