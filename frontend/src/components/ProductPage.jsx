import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, Input, Loading, Pagination, Select, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const initialForm = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  description: '',
  costPrice: '',
  sellingPrice: '',
  stock: '',
  minimumStock: '',
  unit: 'pcs',
  isActive: true,
};

export function ProductPage({ user, route, navigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingId, setEditingId] = useState('');
  const canUpdate = user?.role?.permissions?.includes('products.update') || user?.role?.name === 'Admin';
  const canDelete = user?.role?.permissions?.includes('products.delete') || user?.role?.name === 'Admin';

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: getAuthHeaders(),
      });
      const categoryList = response.data?.data || [];
      setCategories(categoryList);
      if (!form.category && categoryList[0]) {
        setForm((current) => ({ ...current, category: categoryList[0]._id }));
      }
    } catch (error) {
      console.error('Category load failed', error);
    }
  };

  const fetchProducts = async (nextPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await axios.get(`${API_URL}/products?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const payload = response.data?.data || {};
      setProducts(payload.items || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts(1);
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [search, categoryFilter]);

  const isCreateOrEditRoute = useMemo(() => route === '/products/create' || /^\/products\/.+\/edit$/.test(route || ''), [route]);

  const resetForm = () => {
    setForm({ ...initialForm, category: categories[0]?._id || '' });
    setEditingId('');
    setError('');
    navigate('/products');
  };

  const loadProductForEdit = async (productId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products/${productId}`, {
        headers: getAuthHeaders(),
      });
      const product = response.data?.data || {};
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category?._id || product.category || '',
        description: product.description || '',
        costPrice: product.costPrice ?? '',
        sellingPrice: product.sellingPrice ?? '',
        stock: product.stock ?? '',
        minimumStock: product.minimumStock ?? '',
        unit: product.unit || 'pcs',
        isActive: product.isActive ?? true,
      });
      setEditingId(productId);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!route || route === '/products') {
      setEditingId('');
      setForm((current) => ({ ...current, category: categories[0]?._id || current.category || '' }));
      return;
    }

    if (route === '/products/create') {
      setEditingId('');
      setForm({ ...initialForm, category: categories[0]?._id || '' });
      return;
    }

    const match = route.match(/^\/products\/(.+)\/edit$/);
    if (match) {
      loadProductForEdit(match[1]);
    }
  }, [route, categories]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.sku.trim() || !form.category) {
      setError('Name, SKU and category are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim(),
        description: form.description.trim(),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock),
        minimumStock: Number(form.minimumStock),
        isActive: form.isActive,
      };

      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API_URL}/products`, payload, { headers: getAuthHeaders() });
      }

      resetForm();
      await fetchProducts(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      setSaving(true);
      await axios.delete(`${API_URL}/products/${productId}`, { headers: getAuthHeaders() });
      await fetchProducts(page);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete product');
    } finally {
      setSaving(false);
    }
  };

  const productRows = useMemo(() => products.map((product) => ({
    id: product._id,
    name: product.name,
    sku: product.sku,
    category: product.category?.name || 'Unknown',
    stock: product.stock,
    price: `\$${Number(product.sellingPrice || 0).toFixed(2)}`,
    isActive: product.isActive,
    actions: (
      <div className="erp-row-actions">
        {canUpdate ? <Button type="button" variant="secondary" onClick={() => navigate(`/products/${product._id}/edit`)}>Edit</Button> : null}
        {canDelete ? <Button type="button" variant="danger" onClick={() => handleDelete(product._id)}>Delete</Button> : null}
      </div>
    ),
  })), [products, canUpdate, canDelete, navigate]);

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Catalog</p>
          <h2>Products</h2>
        </div>
        <div className="erp-toolbar">
          <Button type="button" variant="secondary" onClick={() => navigate('/products/create')}>
            Add product
          </Button>
          <Badge tone="primary">{user?.role?.name || 'User'} access</Badge>
        </div>
      </section>

      {route === '/products' || route === undefined ? (
        <>
          <Card title="Search and filter" subtitle="Locate products by name, SKU, or category.">
            <div className="erp-form-grid">
              <Input
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search SKU or product name"
              />
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

          <Card title="Product list" subtitle="Current active catalog inventory items.">
            {loading ? (
              <Loading message="Loading products..." />
            ) : products.length === 0 ? (
              <EmptyState title="No products found" description="Adjust the search or create a new product." />
            ) : (
              <>
                <Table
                  columns={[
                    { key: 'name', label: 'Product' },
                    { key: 'sku', label: 'SKU' },
                    { key: 'category', label: 'Category' },
                    { key: 'stock', label: 'Stock' },
                    { key: 'price', label: 'Price' },
                    { key: 'isActive', label: 'Status', render: (value) => <Badge tone={value ? 'success' : 'secondary'}>{value ? 'Active' : 'Inactive'}</Badge> },
                    { key: 'actions', label: 'Actions', render: (_, row) => row.actions },
                  ]}
                  rows={productRows}
                />
                <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => {
                  setPage(nextPage);
                  fetchProducts(nextPage);
                }} />
              </>
            )}
          </Card>
        </>
      ) : (
        <Card title={editingId ? 'Edit product' : 'Create product'} subtitle="Keep the item details aligned with catalog and stock rules.">
          <form className="erp-form" onSubmit={handleSubmit}>
            <div className="erp-form-grid">
              <Input label="Product name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Laptop Pro" />
              <Input label="SKU" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value.toUpperCase() }))} placeholder="LP-1001" />
            </div>

            <div className="erp-form-grid">
              <Input label="Barcode" value={form.barcode} onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))} placeholder="Optional barcode" />
              <label className="erp-field">
                <span className="erp-field-label">Category</span>
                <select className="erp-input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <Input label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Short product description" />

            <div className="erp-form-grid">
              <Input label="Cost price" type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm((current) => ({ ...current, costPrice: event.target.value }))} />
              <Input label="Selling price" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(event) => setForm((current) => ({ ...current, sellingPrice: event.target.value }))} />
            </div>

            <div className="erp-form-grid">
              <Input label="Current stock" type="number" min="0" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} />
              <Input label="Minimum stock" type="number" min="0" value={form.minimumStock} onChange={(event) => setForm((current) => ({ ...current, minimumStock: event.target.value }))} />
            </div>

            <div className="erp-form-grid">
              <Input label="Unit" value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="pcs" />
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
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
                Back to list
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
