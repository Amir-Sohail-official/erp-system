import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading, Select, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const reportTabs = [
  { key: 'sales', label: 'Sales', path: '/reports/sales' },
  { key: 'purchases', label: 'Purchases', path: '/reports/purchases' },
  { key: 'inventory', label: 'Inventory', path: '/reports/inventory' },
  { key: 'profit', label: 'Profit', path: '/reports/profit' },
];

const defaultFilters = {
  fromDate: '',
  toDate: '',
  customer: '',
  supplier: '',
  product: '',
  category: '',
  paymentStatus: '',
};

export function ReportsPage({ user, route, navigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('sales');
  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState({ rows: [], totalRevenue: 0, totalPurchases: 0, totalInventoryValue: 0, grossProfit: 0 });

  const activeTab = useMemo(() => {
    if (route && route.startsWith('/reports/')) {
      const segment = route.split('/reports/')[1];
      if (segment && reportTabs.some((tab) => tab.key === segment)) {
        return segment;
      }
    }
    return 'sales';
  }, [route]);

  useEffect(() => {
    setReportType(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    if (!token) return;

    const controller = new AbortController();

    const fetchReport = async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      try {
        const endpoint = `/reports/${reportType}`;
        const response = await axios.get(`${API_URL}${endpoint}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        setData(response.data.data || {});
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError?.response?.data?.message || 'Unable to load report');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [reportType, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const summary = useMemo(() => {
    if (reportType === 'sales') {
      return [
        { label: 'Total Revenue', value: Number(data.totalRevenue || 0).toFixed(2) },
        { label: 'Orders', value: data.orderCount || 0 },
      ];
    }

    if (reportType === 'purchases') {
      return [
        { label: 'Total Purchases', value: Number(data.totalPurchases || 0).toFixed(2) },
        { label: 'Orders', value: data.orderCount || 0 },
      ];
    }

    if (reportType === 'inventory') {
      return [
        { label: 'Inventory Value', value: Number(data.totalInventoryValue || 0).toFixed(2) },
        { label: 'Low Stock', value: data.lowStockCount || 0 },
        { label: 'Out of Stock', value: data.outOfStockCount || 0 },
      ];
    }

    return [
      { label: 'Gross Profit', value: Number(data.grossProfit || 0).toFixed(2) },
      { label: 'Sales Count', value: data.salesCount || 0 },
    ];
  }, [data, reportType]);

  const rows = data.rows || [];

  const columns = reportType === 'sales'
    ? [
      { key: 'invoiceNumber', label: 'Invoice' },
      { key: 'customer', label: 'Customer', render: (value) => value?.name || 'Walk-in customer' },
      { key: 'paymentStatus', label: 'Status' },
      { key: 'totalAmount', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
      { key: 'createdAt', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
    ]
    : reportType === 'purchases'
      ? [
        { key: 'purchaseNumber', label: 'Purchase' },
        { key: 'supplier', label: 'Supplier', render: (value) => value?.name || '—' },
        { key: 'paymentStatus', label: 'Status' },
        { key: 'totalAmount', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
        { key: 'createdAt', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
      ]
      : reportType === 'inventory'
        ? [
          { key: 'name', label: 'Product' },
          { key: 'sku', label: 'SKU' },
          { key: 'stock', label: 'Stock' },
          { key: 'minimumStock', label: 'Min Stock' },
          { key: 'costPrice', label: 'Cost', render: (value) => Number(value || 0).toFixed(2) },
        ]
        : [
          { key: 'grossProfit', label: 'Gross Profit', render: () => Number(data.grossProfit || 0).toFixed(2) },
          { key: 'salesCount', label: 'Sales Count', render: () => data.salesCount || 0 },
        ];

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Analytics</p>
          <h2>Reports</h2>
        </div>
        <Badge tone="primary">{user?.role?.name || 'User'}</Badge>
      </section>

      <Card className="erp-report-tabs">
        <div className="erp-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {reportTabs.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant={tab.key === reportType ? 'primary' : 'secondary'}
              onClick={() => navigate(tab.path)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card title="Filters" subtitle="Business filters for report data">
        <div className="erp-form-grid">
          <Input label="Date from" type="date" value={filters.fromDate} onChange={(event) => handleFilterChange('fromDate', event.target.value)} />
          <Input label="Date to" type="date" value={filters.toDate} onChange={(event) => handleFilterChange('toDate', event.target.value)} />
          <Input label="Customer" value={filters.customer} onChange={(event) => handleFilterChange('customer', event.target.value)} placeholder="customer id" />
          <Input label="Supplier" value={filters.supplier} onChange={(event) => handleFilterChange('supplier', event.target.value)} placeholder="supplier id" />
          <Input label="Product" value={filters.product} onChange={(event) => handleFilterChange('product', event.target.value)} placeholder="product id" />
          <Input label="Category" value={filters.category} onChange={(event) => handleFilterChange('category', event.target.value)} placeholder="category id" />
          <Select label="Payment status" value={filters.paymentStatus} onChange={(event) => handleFilterChange('paymentStatus', event.target.value)}>
            <option value="">All</option>
            <option value="PAID">PAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="UNPAID">UNPAID</option>
          </Select>
        </div>
      </Card>

      {error ? <ErrorState title="Report failed" description={error} /> : null}

      {!loading && !error ? (
        <div className="erp-metric-grid">
          {summary.map((item) => (
            <Card key={item.label} className="erp-metric-card" title={item.label} subtitle="Current filter set">
              <div className="erp-metric-value-row">
                <strong>{item.value}</strong>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {loading ? <Loading message="Loading report..." /> : (
        <Card title={reportType.toUpperCase()} subtitle="Filtered records from the live ERP database">
          {rows.length ? <Table columns={columns} rows={rows} /> : <EmptyState title="No data found" description="No records match the selected filters." />}
        </Card>
      )}
    </div>
  );
}
