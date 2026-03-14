'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Users, Calendar, IndianRupee, AlertCircle,
  ArrowRight, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number | string | undefined | null): string {
  if (value == null) return '₹0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function daysBetween(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href: string;
  loading?: boolean;
};

function KpiCard({ title, value, icon, iconBg, iconColor, href, loading }: KpiCardProps) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(href)}
      className="cursor-pointer rounded-xl p-5 flex items-start justify-between transition-shadow hover:shadow-md"
      style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
    >
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: '#64748B' }}>{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <p className="text-2xl font-bold" style={{ color: '#0F172A' }}>{value}</p>
        )}
      </div>
      <div
        className="flex items-center justify-center rounded-lg"
        style={{ width: 44, height: 44, backgroundColor: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
    </div>
  );
}

// ─── Status / Payment badges ──────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  CONFIRMED:   { bg: '#ECFDF5', color: '#0D9488' },
  DRAFT:       { bg: '#F1F5F9', color: '#64748B' },
  IN_PROGRESS: { bg: '#FFF7ED', color: '#F97316' },
  COMPLETED:   { bg: '#F0FDF4', color: '#16A34A' },
  CANCELLED:   { bg: '#FEF2F2', color: '#DC2626' },
};

const PMT_STYLE: Record<string, { bg: string; color: string }> = {
  PAID:    { bg: '#ECFDF5', color: '#0D9488' },
  PENDING: { bg: '#FEF2F2', color: '#DC2626' },
  PARTIAL: { bg: '#FFF7ED', color: '#F97316' },
};

function StatusBadge({ value, map }: { value: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[value] ?? { bg: '#F1F5F9', color: '#64748B' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {value}
    </span>
  );
}

// ─── Row border color ─────────────────────────────────────────────────────────

function rowBorderColor(event: any): string {
  if (event.payment_status === 'PENDING') return '#DC2626';
  const days = daysBetween(event.event_date);
  if (days >= 0 && days <= 3) return '#F97316';
  if (event.status === 'CONFIRMED' && event.payment_status === 'PAID') return '#0D9488';
  return 'transparent';
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

type EventFilter = 'today' | 'next7' | 'weekly';
type RevenueRange = 'daily' | 'weekly' | 'monthly';

export default function DashboardPage() {
  const [eventFilter, setEventFilter] = useState<EventFilter>('next7');
  const [revenueRange, setRevenueRange] = useState<RevenueRange>('weekly');

  // ── Queries ──

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-month'],
    queryFn: () => api.get('/inquiries/?created_month=current'),
  });

  const { data: confirmedEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['confirmed-events'],
    queryFn: () => api.get('/events/?status=CONFIRMED&upcoming=true'),
  });

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/reports/dashboard/'),
  });

  const { data: upcomingEvents, isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcoming-events', eventFilter],
    queryFn: () => api.get(`/events/?upcoming=true&filter=${eventFilter}`),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-trend', revenueRange],
    queryFn: () => api.get(`/reports/revenue-trend/?range=${revenueRange}`),
  });

  const { data: topDishes, isLoading: dishesLoading } = useQuery({
    queryKey: ['top-dishes'],
    queryFn: () => api.get('/reports/top-dishes/'),
  });

  // ── Derived values ──

  const leadsCount = leadsData?.count ?? 0;
  const confirmedCount = confirmedEvents?.count ?? 0;
  const monthlyRevenue = dashData?.monthly_revenue ?? 0;
  const pendingAmount = dashData?.pending_payment_amount ?? 0;

  const upcomingList: any[] = upcomingEvents?.results ?? upcomingEvents ?? [];
  const revenueTrend: any[] = revenueData?.results ?? revenueData ?? [];
  const eventsByDay: any[] = dashData?.events_per_day ?? [];
  const dishes: any[] = topDishes?.results ?? topDishes ?? [];

  const maxQty = dishes.length > 0 ? Math.max(...dishes.map((d: any) => d.total_quantity)) : 1;

  // ── Render ──

  return (
    <div className="flex flex-col gap-6">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Leads (This Month)"
          value={leadsCount}
          icon={<Users size={20} />}
          iconBg="#EFF6FF"
          iconColor="#3B82F6"
          href="/leads?filter=this_month"
          loading={leadsLoading}
        />
        <KpiCard
          title="Confirmed Events (Upcoming)"
          value={confirmedCount}
          icon={<Calendar size={20} />}
          iconBg="#ECFDF5"
          iconColor="#0D9488"
          href="/events?status=CONFIRMED"
          loading={eventsLoading}
        />
        <KpiCard
          title="Total Revenue (Confirmed)"
          value={formatINR(monthlyRevenue)}
          icon={<IndianRupee size={20} />}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          href="/reports/revenue"
          loading={dashLoading}
        />
        <KpiCard
          title="Pending Payment Amount"
          value={formatINR(pendingAmount)}
          icon={<AlertCircle size={20} />}
          iconBg="#FFF7ED"
          iconColor="#F97316"
          href="/events?payment_status=PENDING"
          loading={dashLoading}
        />
      </div>

      {/* ── Main 2-column grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── LEFT: Upcoming Events Table (3/5) ── */}
        <div
          className="xl:col-span-3 rounded-xl flex flex-col"
          style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0F172A' }}>Upcoming Events</h2>
            <div className="flex items-center gap-1">
              {(['today', 'next7', 'weekly'] as EventFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setEventFilter(f)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: eventFilter === f ? '#1C3355' : 'transparent',
                    color: eventFilter === f ? '#fff' : '#64748B',
                  }}
                >
                  {f === 'today' ? 'Today' : f === 'next7' ? 'Next 7 Days' : 'Weekly'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {upcomingLoading ? (
              <div className="p-5 flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : upcomingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94A3B8' }}>
                <Calendar size={36} className="mb-3 opacity-40" />
                <p className="text-sm">No upcoming events</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Event Name', 'Date', 'Venue', 'Guests', 'Status', 'Payment'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold"
                        style={{ color: '#64748B' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcomingList.map((event: any) => {
                    const borderColor = rowBorderColor(event);
                    return (
                      <tr
                        key={event.id}
                        onClick={() => window.location.href = `/events/${event.id}`}
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                        style={{
                          borderLeft: `3px solid ${borderColor}`,
                          borderBottom: '1px solid #F1F5F9',
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: '#0F172A' }}>
                          {event.event_name || event.name || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#64748B' }}>
                          {event.event_date ? fmtDate(event.event_date) : '—'}
                        </td>
                        <td className="px-4 py-3 max-w-[120px] truncate" style={{ color: '#64748B' }}>
                          {event.venue || '—'}
                        </td>
                        <td className="px-4 py-3" style={{ color: '#64748B' }}>
                          {event.guest_count ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={event.status} map={STATUS_STYLE} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={event.payment_status ?? 'PENDING'} map={PMT_STYLE} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-3 border-t" style={{ borderColor: '#E2E8F0' }}>
            <Link
              href="/events"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: '#D95F0E' }}
            >
              View All Events <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── RIGHT: Analytics (2/5) ── */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* Revenue Trend Line Chart */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: '#D95F0E' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Revenue Trend</h3>
              </div>
              <div className="flex items-center gap-1">
                {(['daily', 'weekly', 'monthly'] as RevenueRange[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRevenueRange(r)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
                    style={{
                      backgroundColor: revenueRange === r ? '#FFF7ED' : 'transparent',
                      color: revenueRange === r ? '#D95F0E' : '#94A3B8',
                    }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {revenueLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: any) => [formatINR(v), 'Revenue']}
                    contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E2E8F0' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#D95F0E" strokeWidth={2}
                    dot={{ fill: '#D95F0E', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Events Per Day Bar Chart */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>
              Events Per Day <span className="text-xs font-normal" style={{ color: '#94A3B8' }}>(last 7 days)</span>
            </h3>
            {dashLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={eventsByDay} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: any) => [v, 'Events']}
                    contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="count" fill="#0D9488" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Dishes Table */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Top Dishes by Quantity</h3>
            {dishesLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : dishes.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#94A3B8' }}>No data available</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-12 text-xs font-semibold pb-1 border-b" style={{ color: '#64748B', borderColor: '#E2E8F0' }}>
                  <span className="col-span-5">Dish</span>
                  <span className="col-span-3 text-right">Qty</span>
                  <span className="col-span-4 text-right">%</span>
                </div>
                {dishes.slice(0, 7).map((dish: any, i: number) => {
                  const pct = maxQty > 0 ? Math.round((dish.total_quantity / maxQty) * 100) : 0;
                  return (
                    <div key={i} className="grid grid-cols-12 items-center gap-1 text-xs">
                      <span className="col-span-5 truncate font-medium" style={{ color: '#0F172A' }}>
                        {dish.dish_name ?? dish.name}
                      </span>
                      <span className="col-span-3 text-right" style={{ color: '#64748B' }}>
                        {dish.total_quantity}
                      </span>
                      <div className="col-span-4 flex items-center gap-1.5">
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: '#F1F5F9' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: '#0D9488' }}
                          />
                        </div>
                        <span className="text-[10px] w-7 text-right" style={{ color: '#64748B' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
