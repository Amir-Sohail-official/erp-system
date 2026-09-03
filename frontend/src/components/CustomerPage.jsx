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

export function CustomerPage({ user, route, navigate }) {
  const [customers, setCustomers] = useState([]);
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

  const fetchCustomers = async (nextPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(nextPage), limit: '10', sortBy, sortOrder });
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'all') params.set('status', status);
      const response = await axios.get(`${API_URL}/customers?${params.toString()}`, { headers: getAuthHeaders() });
      const payload = response.data?.data || {};
      setCustomers(payload.items || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, status, sortBy, sortOrder]);

  useEffect(() => {
    if (route && route !== '/customers' && route !== '/customers/create') {
      const match = route.match(/^\/customers\/(.+)\/edit$/);
      if (match) {
        loadCustomer(match[1]);
      }
    }
  }, [route]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId('');
    setError('');
    navigate('/customers');
  };

  const loadCustomer = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/customers/${id}`, { headers: getAuthHeaders() });
      const customer = response.data?.data || {};
      setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        openingBalance: String(customer.openingBalance ?? 0),
        isActive: customer.isActive ?? true,
      });
      setEditingId(id);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Customer name is required');
      return;
    }

    if (editingId && form.isActive === false && !window.confirm('Deactivate this customer? This will make the record inactive.')) {
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
        await axios.put(`${API_URL}/customers/${editingId}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API_URL}/customers`, payload, { headers: getAuthHeaders() });
      }

      resetForm();
      await fetchCustomers(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Delete this customer?')) return;

    try {
      setSaving(true);
      await axios.delete(`${API_URL}/customers/${customerId}`, { headers: getAuthHeaders() });
      await fetchCustomers(page);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete customer');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (customerId, nextStatus) => {
    if (!window.confirm(nextStatus ? 'Reactivate this customer?' : 'Deactivate this customer?')) {
      return;
    }

    try {
      setSaving(true);
      await axios.put(`${API_URL}/customers/${customerId}`, { isActive: nextStatus }, { headers: getAuthHeaders() });
      await fetchCustomers(page);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update customer status');
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => customers.map((customer) => ({
    id: customer._id,
    name: customer.name,
    email: customer.email || '—',
    phone: customer.phone || '—',
    city: customer.city || '—',
    openingBalance: `$${Number(customer.openingBalance || 0).toFixed(2)}`,
    isActive: customer.isActive,
    actions: (
      <div className="erp-row-actions">
        <Button type="button" variant="secondary" onClick={() => navigate(`/customers/${customer._id}/edit`)}>Edit</Button>
        <Button type="button" variant={customer.isActive ? 'danger' : 'secondary'} onClick={() => toggleStatus(customer._id, !customer.isActive)}>
          {customer.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    ),
  })), [customers, navigate]);

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">CRM</p>
          <h2>Customers</h2>
        </div>
        <div className="erp-toolbar">
          <Button type="button" variant="secondary" onClick={() => navigate('/customers/create')}>Add customer</Button>
          <Badge tone="primary">{user?.role?.name || 'User'} access</Badge>
        </div>
      </section>

      {route === '/customers' ? (
        <>
          <Card title="Search and filter" subtitle="Search by name, phone or email.">
            <div className="erp-form-grid">
              <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" />
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

          <Card title="Customer list" subtitle="Current customer records.">
            {loading ? (
              <Loading message="Loading customers..." />
            ) : customers.length === 0 ? (
              <EmptyState title="No customers found" description="Create a customer to get started." />
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
                <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => { setPage(nextPage); fetchCustomers(nextPage); }} />
              </>
            )}
          </Card>
        </>
      ) : (
        <Card title={editingId ? 'Edit customer' : 'Create customer'} subtitle="Keep customer records ready for future transactions.">
          <form className="erp-form" onSubmit={handleSubmit}>
            <div className="erp-form-grid">
              <Input label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="John Doe" />
              <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="john@example.com" />
            </div>

            <div className="erp-form-grid">
              <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+1 555 123 4567" />
              <Input label="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="New York" />
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
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update customer' : 'Create customer'}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/customers')}>Back to list</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
