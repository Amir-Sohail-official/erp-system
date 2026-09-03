import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Badge, Card, EmptyState, ErrorState, Loading, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const currency = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('erp_token');
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
          setError(requestError?.response?.data?.message || 'Unable to load dashboard metrics');
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
    { label: 'Total Products', value: data?.totalProducts ?? 0, status: 'Live count', tone: 'primary' },
    { label: 'Customers', value: data?.totalCustomers ?? 0, status: 'Active customers', tone: 'success' },
    { label: 'Suppliers', value: data?.totalSuppliers ?? 0, status: 'Active suppliers', tone: 'warning' },
    { label: 'Today\'s Sales', value: currency(data?.todaySales ?? 0), status: 'Revenue today', tone: 'danger' },
    { label: 'Today\'s Purchases', value: currency(data?.todayPurchases ?? 0), status: 'Purchase total', tone: 'secondary' },
    { label: 'Low Stock', value: data?.lowStockCount ?? 0, status: 'At risk', tone: 'warning' },
  ];

  const salesByDayRows = (data?.salesByDay || []).map((item) => ({
    id: item._id,
    label: item._id,
    total: currency(item.totalSales),
  }));

  const purchaseByDateRows = (data?.purchaseByDate || []).map((item) => ({
    id: item._id,
    label: item._id,
    total: currency(item.totalPurchases),
  }));

  const topProductsRows = (data?.topSellingProducts || []).map((item, index) => ({
    id: item._id || index,
    product: item.productName,
    sold: item.totalQuantity,
    revenue: currency(item.totalRevenue),
  }));

  const categoryRows = (data?.salesByCategory || []).map((item) => ({
    id: item._id,
    category: item._id,
    revenue: currency(item.totalRevenue),
  }));

  return (
    <div className="erp-dashboard">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Overview</p>
          <h2>Dashboard</h2>
        </div>
        <Badge tone="primary">{user?.role?.name || 'User'} access</Badge>
      </section>

      <div className="erp-metric-grid">
        {metrics.map((card) => (
          <Card key={card.label} className="erp-metric-card" title={card.label} subtitle={card.status}>
            <div className="erp-metric-value-row">
              <strong>{card.value}</strong>
              <Badge tone={card.tone}>{card.status}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="erp-dashboard-grid">
        <Card title="Sales trend" subtitle="Daily sales totals">
          {salesByDayRows.length ? (
            <Table
              columns={[
                { key: 'label', label: 'Date' },
                { key: 'total', label: 'Sales', render: (value) => value },
              ]}
              rows={salesByDayRows}
            />
          ) : (
            <EmptyState title="No sales data" description="No daily sales have been recorded yet." />
          )}
        </Card>

        <Card title="Purchase trend" subtitle="Daily purchase totals">
          {purchaseByDateRows.length ? (
            <Table
              columns={[
                { key: 'label', label: 'Date' },
                { key: 'total', label: 'Purchases', render: (value) => value },
              ]}
              rows={purchaseByDateRows}
            />
          ) : (
            <EmptyState title="No purchase data" description="No daily purchase data is available yet." />
          )}
        </Card>
      </div>

      <div className="erp-dashboard-grid">
        <Card title="Top products" subtitle="Best-selling products by revenue">
          {topProductsRows.length ? (
            <Table
              columns={[
                { key: 'product', label: 'Product' },
                { key: 'sold', label: 'Units sold' },
                { key: 'revenue', label: 'Revenue' },
              ]}
              rows={topProductsRows}
            />
          ) : (
            <EmptyState title="No product data" description="Sales data will populate this view." />
          )}
        </Card>

        <Card title="Sales by category" subtitle="Category revenue mix">
          {categoryRows.length ? (
            <Table
              columns={[
                { key: 'category', label: 'Category' },
                { key: 'revenue', label: 'Revenue' },
              ]}
              rows={categoryRows}
            />
          ) : (
            <EmptyState title="No category data" description="No sales category breakdown is available yet." />
          )}
        </Card>
      </div>

      <Card title="Business summary" subtitle="Inventory and performance snapshot">
        <div className="erp-form-grid">
          <div className="erp-field"><span className="erp-field-label">Outstanding</span><div className="erp-input">{currency(data?.totalOutstanding ?? 0)}</div></div>
          <div className="erp-field"><span className="erp-field-label">Gross profit</span><div className="erp-input">{currency(data?.profit?.grossProfit ?? 0)}</div></div>
          <div className="erp-field"><span className="erp-field-label">Inventory units</span><div className="erp-input">{data?.inventory?.totalUnits ?? 0}</div></div>
          <div className="erp-field"><span className="erp-field-label">Inventory value</span><div className="erp-input">{currency(data?.inventory?.inventoryValue ?? 0)}</div></div>
        </div>
      </Card>
    </div>
  );
}
