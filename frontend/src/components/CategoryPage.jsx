import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, Input, Loading, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export function CategoryPage({ user }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [editingId, setEditingId] = useState('');
  const canUpdate = user?.role?.permissions?.includes('categories.update') || user?.role?.name === 'Admin';
  const canDelete = user?.role?.permissions?.includes('categories.delete') || user?.role?.name === 'Admin';

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categories`, {
        headers: getAuthHeaders(),
      });
      setCategories(response.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', isActive: true });
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      };

      if (editingId) {
        await axios.put(`${API_URL}/categories/${editingId}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API_URL}/categories`, payload, { headers: getAuthHeaders() });
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setError('');
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setSaving(true);
      await axios.delete(`${API_URL}/categories/${categoryId}`, {
        headers: getAuthHeaders(),
      });
      await fetchCategories();
      if (editingId === categoryId) resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Catalog</p>
          <h2>Categories</h2>
        </div>
        <Badge tone="primary">{user?.role?.name || 'User'} access</Badge>
      </section>

      <Card title="Manage categories" subtitle="Create, edit and deactivate catalog entries.">
        <form className="erp-form" onSubmit={handleSubmit}>
          <div className="erp-form-grid">
            <Input
              label="Category name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Office Supplies"
            />
            <label className="erp-field">
              <span className="erp-field-label">Status</span>
              <select
                className="erp-input"
                value={String(form.isActive)}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </div>

          <Input
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Optional notes for this category"
          />

          {error ? <div className="erp-alert">{error}</div> : null}

          <div className="erp-form-actions">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update category' : 'Create category'}</Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Category list" subtitle="Current catalog categories">
        {loading ? (
          <Loading message="Loading categories..." />
        ) : categories.length === 0 ? (
          <EmptyState title="No categories available" description="Create your first category to begin the catalog." />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'description', label: 'Description' },
              { key: 'isActive', label: 'Status', render: (value) => <Badge tone={value ? 'success' : 'secondary'}>{value ? 'Active' : 'Inactive'}</Badge> },
              { key: 'actions', label: 'Actions', render: (_, row) => (
                <div className="erp-row-actions">
                  {canUpdate ? <Button type="button" variant="secondary" onClick={() => handleEdit(row)}>Edit</Button> : null}
                  {canDelete ? <Button type="button" variant="danger" onClick={() => handleDelete(row._id)}>Delete</Button> : null}
                </div>
              ) },
            ]}
            rows={categories.map((category) => ({
              ...category,
              description: category.description || '—',
              id: category._id,
            }))}
            emptyTitle="No categories found"
            emptyDescription="There are no categories in the system yet."
          />
        )}
      </Card>
    </div>
  );
}
