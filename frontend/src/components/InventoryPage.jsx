import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, Input, Loading, Pagination, Select, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export function InventoryPage({ user, route, navigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adjustment, setAdjustment] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, { headers: getAuthHeaders() });
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load categories for inventory', error);
    }
  };

  const fetchInventory = async (nextPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await axios.get(`${API_URL}/inventory?${params.toString()}`, { headers: getAuthHeaders() });
      const payload = response.data?.data || {};
      setProducts(payload.items || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryHistory = async (productId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inventory/${productId}/history`, { headers: getAuthHeaders() });
      const historyItems = response.data?.data || [];
      setHistory(historyItems);
      const selected = products.find((item) => item._id === productId) || null;
      setSelectedProduct(selected);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load stock history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (route === '/inventory' || !route) {
      fetchInventory(1);
      return;
    }

    const match = route.match(/^\/inventory\/(.+)$/);
    if (match) {
      const productId = match[1];
      fetchInventoryHistory(productId);
    }
  }, [route, search, categoryFilter]);

  const handleAdjust = async (event) => {
    event.preventDefault();
    const productId = selectedProduct?._id || route?.split('/').pop();

    if (!productId) {
      setError('Select a product first');
      return;
    }

    if (!reason.trim()) {
      setError('A stock movement reason is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await axios.post(
        `${API_URL}/inventory/${productId}/adjust`,
        { adjustment: Number(adjustment), reason: reason.trim() },
        { headers: getAuthHeaders() },
      );
      setAdjustment('');
      setReason('');
      if (route === '/inventory' || !route) {
        await fetchInventory(page);
      } else {
        await fetchInventoryHistory(productId);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = useMemo(() => products.filter((product) => Number(product.currentStock ?? 0) <= Number(product.minimumStock ?? 0)).length, [products]);

  if (route && route !== '/inventory') {
    const productId = route.split('/').filter(Boolean).pop();
    const product = products.find((item) => item._id === productId) || selectedProduct;

    return (
      <div className="erp-page-stack">
        <section className="erp-page-header">
          <div>
            <p className="erp-page-kicker">Inventory</p>
            <h2>{product ? product.name : 'Stock history'}</h2>
          </div>
          <div className="erp-toolbar">
            <Button type="button" variant="secondary" onClick={() => navigate('/inventory')}>Back to inventory</Button>
          </div>
        </section>

        {product ? (
          <Card title="Current stock" subtitle="Live inventory snapshot.">
            <div className="erp-form-grid">
              <div className="erp-field">
                <span className="erp-field-label">Current stock</span>
                <div className="erp-input" style={{ display: 'flex', alignItems: 'center' }}>{product.currentStock}</div>
              </div>
              <div className="erp-field">
                <span className="erp-field-label">Minimum stock</span>
                <div className="erp-input" style={{ display: 'flex', alignItems: 'center' }}>{product.minimumStock}</div>
              </div>
              <div className="erp-field">
                <span className="erp-field-label">Status</span>
                <div className="erp-input" style={{ display: 'flex', alignItems: 'center' }}>
                  <Badge tone={product.isLowStock ? 'warning' : 'success'}>{product.stockStatus}</Badge>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <Card title="Stock movement history" subtitle="Every logged stock change appears here.">
          {loading ? (
            <Loading message="Loading stock history..." />
          ) : history.length === 0 ? (
            <EmptyState title="No stock movements yet" description="Adjust stock to create history entries." />
          ) : (
            <Table
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'previousStock', label: 'Previous' },
                { key: 'newStock', label: 'New' },
                { key: 'reason', label: 'Reason' },
                { key: 'createdAt', label: 'Date', render: (value) => new Date(value).toLocaleString() },
              ]}
              rows={history.map((entry) => ({
                id: entry._id,
                type: entry.type,
                quantity: entry.quantity,
                previousStock: entry.previousStock,
                newStock: entry.newStock,
                reason: entry.reason,
                createdAt: entry.createdAt,
              }))}
            />
          )}
        </Card>

        <Card title="Adjust stock" subtitle="Authorized inventory updates only.">
          <form className="erp-form" onSubmit={handleAdjust}>
            <div className="erp-form-grid">
              <Input label="Adjustment" type="number" step="1" value={adjustment} onChange={(event) => setAdjustment(event.target.value)} placeholder="e.g. 5 or -5" />
              <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Physical stock count" />
            </div>
            {error ? <div className="erp-alert">{error}</div> : null}
            <div className="erp-form-actions">
              <Button type="submit" disabled={saving}>{saving ? 'Adjusting...' : 'Submit adjustment'}</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Operations</p>
          <h2>Inventory</h2>
        </div>
        <div className="erp-toolbar">
          <Badge tone={lowStockCount > 0 ? 'warning' : 'success'}>{lowStockCount} low stock</Badge>
        </div>
      </section>

      <Card title="Search and filter" subtitle="Track on-hand inventory and low stock warnings.">
        <div className="erp-form-grid">
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or SKU" />
          <label className="erp-field">
            <span className="erp-field-label">Category</span>
            <select className="erp-input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card title="Stock overview" subtitle="Products with stock thresholds and low stock alerts.">
        {loading ? (
          <Loading message="Loading inventory..." />
        ) : products.length === 0 ? (
          <EmptyState title="No inventory found" description="No products match the current search criteria." />
        ) : (
          <>
            <Table
              columns={[
                { key: 'name', label: 'Product' },
                { key: 'category', label: 'Category' },
                { key: 'currentStock', label: 'Current stock' },
                { key: 'minimumStock', label: 'Minimum stock' },
                { key: 'stockStatus', label: 'Status', render: (value, row) => <Badge tone={row.isLowStock ? 'warning' : 'success'}>{value}</Badge> },
                { key: 'actions', label: 'Actions', render: (_, row) => (
                  <div className="erp-row-actions">
                    <Button type="button" variant="secondary" onClick={() => navigate(`/inventory/${row.id}`)}>History</Button>
                    <Button type="button" variant="secondary" onClick={() => { setSelectedProduct(products.find((item) => item._id === row.id)); navigate(`/inventory/${row.id}`); }}>Adjust</Button>
                  </div>
                ) },
              ]}
              rows={products.map((product) => ({
                id: product._id,
                name: product.name,
                category: product.category?.name || 'Uncategorized',
                currentStock: Number(product.currentStock ?? 0),
                minimumStock: Number(product.minimumStock ?? 0),
                stockStatus: product.stockStatus,
                isLowStock: product.isLowStock,
              }))}
            />
            <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => { setPage(nextPage); fetchInventory(nextPage); }} />
          </>
        )}
      </Card>
    </div>
  );
}
