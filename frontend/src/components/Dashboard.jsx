import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { Badge, Card, EmptyState, ErrorState, Loading, Table } from "./ui.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

const currency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CATEGORY_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#eab308",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
];

export function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        setData(response.data.data || null);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError?.response?.data?.message ||
              "Unable to load dashboard metrics",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, []);

  if (loading) {
    return <Loading message="Loading dashboard metrics..." />;
  }

  if (error) {
    return <ErrorState title="Dashboard unavailable" description={error} />;
  }

  const metrics = [
    {
      label: "Total Products",
      value: data?.totalProducts ?? 0,
      status: "Live count",
      tone: "primary",
    },
    {
      label: "Customers",
      value: data?.totalCustomers ?? 0,
      status: "Active customers",
      tone: "success",
    },
    {
      label: "Suppliers",
      value: data?.totalSuppliers ?? 0,
      status: "Active suppliers",
      tone: "warning",
    },
    {
      label: "Today's Sales",
      value: currency(data?.todaySales ?? 0),
      status: "Revenue today",
      tone: "danger",
    },
    {
      label: "Today's Purchases",
      value: currency(data?.todayPurchases ?? 0),
      status: "Purchase total",
      tone: "secondary",
    },
    {
      label: "Low Stock",
      value: data?.lowStockCount ?? 0,
      status: "At risk",
      tone: "warning",
    },
  ];

  // Merge sales and purchase by date for grouped bar chart
  const salesByDay = data?.salesByDay || [];
  const purchaseByDate = data?.purchaseByDate || [];

  const dateMap = new Map();
  salesByDay.forEach((item) => {
    dateMap.set(item._id, {
      date: item._id,
      sales: Number(item.totalSales) || 0,
      purchases: 0,
    });
  });
  purchaseByDate.forEach((item) => {
    const existing = dateMap.get(item._id);
    if (existing) {
      existing.purchases = Number(item.totalPurchases) || 0;
    } else {
      dateMap.set(item._id, {
        date: item._id,
        sales: 0,
        purchases: Number(item.totalPurchases) || 0,
      });
    }
  });

  const trendChartData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  // Category donut chart data
  const categoryChartData = (data?.salesByCategory || []).map(
    (item, index) => ({
      name: item._id,
      value: Number(item.totalRevenue) || 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }),
  );

  const topProductsRows = (data?.topSellingProducts || []).map(
    (item, index) => ({
      id: item._id || index,
      product: item.productName,
      sold: item.totalQuantity,
      revenue: currency(item.totalRevenue),
    }),
  );

  const formatTooltipValue = (value) => currency(value);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renderCategoryLabel = ({ name, percent }) =>
    `${name} ${(percent * 100).toFixed(0)}%`;

  return (
    <div className="erp-dashboard">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Overview</p>
          <h2>Dashboard</h2>
        </div>
        <Badge tone="primary">{user?.role?.name || "User"} access</Badge>
      </section>

      <div className="erp-metric-grid">
        {metrics.map((card) => (
          <Card
            key={card.label}
            className="erp-metric-card"
            title={card.label}
            subtitle={card.status}
          >
            <div className="erp-metric-value-row">
              <strong>{card.value}</strong>
              <Badge tone={card.tone}>{card.status}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="erp-dashboard-grid">
        <Card title="Sales & Purchase Trend" subtitle="Daily comparison">
          {trendChartData.length ? (
            <div style={{ width: "100%", height: 320, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendChartData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  barGap={4}
                  barCategoryGap="20%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                    }
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={formatTooltipValue}
                    labelFormatter={formatDate}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 16 }} iconType="circle" />
                  <Bar
                    dataKey="sales"
                    name="Sales"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="purchases"
                    name="Purchases"
                    fill="#f97316"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No trend data"
              description="No daily sales or purchase data has been recorded yet."
            />
          )}
        </Card>

        <Card title="Sales by Category" subtitle="Category revenue mix">
          {categoryChartData.length ? (
            <div style={{ width: "100%", height: 320, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={renderCategoryLabel}
                    labelLine={{ stroke: "#9ca3af" }}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => currency(value)}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 16 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No category data"
              description="No sales category breakdown is available yet."
            />
          )}
        </Card>
      </div>

      <div className="erp-dashboard-grid">
        <Card title="Top products" subtitle="Best-selling products by revenue">
          {topProductsRows.length ? (
            <Table
              columns={[
                { key: "product", label: "Product" },
                { key: "sold", label: "Units sold" },
                { key: "revenue", label: "Revenue" },
              ]}
              rows={topProductsRows}
            />
          ) : (
            <EmptyState
              title="No product data"
              description="Sales data will populate this view."
            />
          )}
        </Card>

        <Card
          title="Business summary"
          subtitle="Inventory and performance snapshot"
        >
          <div className="erp-form-grid">
            <div className="erp-field">
              <span className="erp-field-label">Outstanding</span>
              <div className="erp-input">
                {currency(data?.totalOutstanding ?? 0)}
              </div>
            </div>
            <div className="erp-field">
              <span className="erp-field-label">Gross profit</span>
              <div className="erp-input">
                {currency(data?.profit?.grossProfit ?? 0)}
              </div>
            </div>
            <div className="erp-field">
              <span className="erp-field-label">Inventory units</span>
              <div className="erp-input">
                {data?.inventory?.totalUnits ?? 0}
              </div>
            </div>
            <div className="erp-field">
              <span className="erp-field-label">Inventory value</span>
              <div className="erp-input">
                {currency(data?.inventory?.inventoryValue ?? 0)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
