import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, Input, Loading, Pagination, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  openingBalance: '0',
  isActive: true,
};

export function SupplierPage({ user, route, navigate }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState('');

  const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

  const fetchSuppliers = async (nextPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(nextPage), limit: '10', sortBy, sortOrder });
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'all') params.set('status', status);
      const response = await axios.get(`${API_URL}/suppliers?${params.toString()}`, { headers: getAuthHeaders() });
      const payload = response.data?.data || {};
      setSuppliers(payload.items || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(1);
  }, [search, status, sortBy, sortOrder]);

  useEffect(() => {
    if (route && route !== '/suppliers' && route !== '/suppliers/create') {
      const match = route.match(/^\/suppliers\/(.+)\/edit$/);
      if (match) {
        loadSupplier(match[1]);
      }
    }
  }, [route]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId('');
    setError('');
    navigate('/suppliers');
  };

  const loadSupplier = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/suppliers/${id}`, { headers: getAuthHeaders() });
      const supplier = response.data?.data || {};
      setForm({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        openingBalance: String(supplier.openingBalance ?? 0),
        isActive: supplier.isActive ?? true,
      });
      setEditingId(id);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    if (editingId && form.isActive === false && !window.confirm('Deactivate this supplier? This will make the record inactive.')) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        openingBalance: Number(form.openingBalance || 0),
        isActive: form.isActive,
      };

      if (editingId) {
        await axios.put(`${API_URL}/suppliers/${editingId}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API_URL}/suppliers`, payload, { headers: getAuthHeaders() });
      }

      resetForm();
      await fetchSuppliers(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Delete this supplier?')) return;

    try {
      setSaving(true);
      await axios.delete(`${API_URL}/suppliers/${supplierId}`, { headers: getAuthHeaders() });
      await fetchSuppliers(page);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete supplier');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (supplierId, nextStatus) => {
    if (!window.confirm(nextStatus ? 'Reactivate this supplier?' : 'Deactivate this supplier?')) {
      return;
    }

    try {
      setSaving(true);
      await axios.put(`${API_URL}/suppliers/${supplierId}`, { isActive: nextStatus }, { headers: getAuthHeaders() });
      await fetchSuppliers(page);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update supplier status');
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => suppliers.map((supplier) => ({
    id: supplier._id,
    name: supplier.name,
    email: supplier.email || '—',
    phone: supplier.phone || '—',
    city: supplier.city || '—',
    openingBalance: `$${Number(supplier.openingBalance || 0).toFixed(2)}`,
    isActive: supplier.isActive,
    actions: (
      <div className="erp-row-actions">
        <Button type="button" variant="secondary" onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}>Edit</Button>
        <Button type="button" variant={supplier.isActive ? 'danger' : 'secondary'} onClick={() => toggleStatus(supplier._id, !supplier.isActive)}>
          {supplier.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    ),
  })), [suppliers, navigate]);

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Procurement</p>
          <h2>Suppliers</h2>
        </div>
        <div className="erp-toolbar">
          <Button type="button" variant="secondary" onClick={() => navigate('/suppliers/create')}>Add supplier</Button>
          <Badge tone="primary">{user?.role?.name || 'User'} access</Badge>
        </div>
      </section>

      {route === '/suppliers' ? (
        <>
          <Card title="Search and filter" subtitle="Search by name, phone or email.">
            <div className="erp-form-grid">
              <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search suppliers" />
              <label className="erp-field">
                <span className="erp-field-label">Status</span>
                <select className="erp-input" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="erp-form-grid">
              <label className="erp-field">
                <span className="erp-field-label">Sort by</span>
                <select className="erp-input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="createdAt">Created date</option>
                  <option value="name">Name</option>
                  <option value="openingBalance">Opening balance</option>
                </select>
              </label>
              <label className="erp-field">
                <span className="erp-field-label">Order</span>
                <select className="erp-input" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>
            </div>
          </Card>

          <Card title="Supplier list" subtitle="Current supplier records.">
            {loading ? (
              <Loading message="Loading suppliers..." />
            ) : suppliers.length === 0 ? (
              <EmptyState title="No suppliers found" description="Create a supplier to get started." />
            ) : (
              <>
                <Table
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'city', label: 'City' },
                    { key: 'openingBalance', label: 'Opening Balance' },
                    { key: 'isActive', label: 'Status', render: (value) => <Badge tone={value ? 'success' : 'secondary'}>{value ? 'Active' : 'Inactive'}</Badge> },
                    { key: 'actions', label: 'Actions', render: (_, row) => row.actions },
                  ]}
                  rows={rows}
                />
                <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => { setPage(nextPage); fetchSuppliers(nextPage); }} />
              </>
            )}
          </Card>
        </>
      ) : (
        <Card title={editingId ? 'Edit supplier' : 'Create supplier'} subtitle="Keep supplier records ready for future procurement flows.">
          <form className="erp-form" onSubmit={handleSubmit}>
            <div className="erp-form-grid">
              <Input label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Acme Supplies" />
              <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="vendor@example.com" />
            </div>

            <div className="erp-form-grid">
              <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+1 555 123 4567" />
              <Input label="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Boston" />
            </div>

            <Input label="Address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Street address" />

            <div className="erp-form-grid">
              <Input label="Opening balance" type="number" min="0" step="0.01" value={form.openingBalance} onChange={(event) => setForm((current) => ({ ...current, openingBalance: event.target.value }))} />
              <label className="erp-field">
                <span className="erp-field-label">Status</span>
                <select className="erp-input" value={String(form.isActive)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'true' }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>

            {error ? <div className="erp-alert">{error}</div> : null}

            <div className="erp-form-actions">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update supplier' : 'Create supplier'}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/suppliers')}>Back to list</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
