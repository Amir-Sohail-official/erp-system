import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, Input, Loading, Pagination, Select, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
});

const getPaymentStatusTone = (status) => {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'warning';
  return 'secondary';
};

export function PurchasePage({ user, route, navigate }) {
  const [purchases, setPurchases] = useState([]);
  const [purchase, setPurchase] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [supplierId, setSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState([]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers`, { headers: getAuthHeaders() });
      setSuppliers(response.data?.data?.items || []);
    } catch (error) {
      console.error('Unable to load suppliers', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?limit=200`, { headers: getAuthHeaders() });
      setProducts(response.data?.data?.items || []);
    } catch (error) {
      console.error('Unable to load products', error);
    }
  };

  const fetchPurchases = async (nextPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
      if (search.trim()) params.set('search', search.trim());
      if (supplierFilter !== 'all') params.set('supplier', supplierFilter);
      if (paymentStatusFilter !== 'all') params.set('paymentStatus', paymentStatusFilter);

      const response = await axios.get(`${API_URL}/purchases?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const payload = response.data?.data || {};
      setPurchases(payload.items || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseDetail = async (purchaseId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/purchases/${purchaseId}`, { headers: getAuthHeaders() });
      setPurchase(response.data?.data || null);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load purchase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (route === '/purchases' || route === undefined) {
      fetchPurchases(1);
    }
  }, [route, search, supplierFilter, paymentStatusFilter]);

  useEffect(() => {
    if (route && route.startsWith('/purchases/') && route !== '/purchases/create' && route !== '/purchases') {
      const parts = route.split('/').filter(Boolean);
      const purchaseId = parts[1];
      if (purchaseId) {
        fetchPurchaseDetail(purchaseId);
      }
    }
  }, [route]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      if (!term) return true;
      return (
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term)
      );
    });
  }, [productSearch, products]);

  const lineSummary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number((Number(item.quantity || 0) * Number(item.costPrice || 0)).toFixed(2)), 0);
    const discount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
    const tax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
    const total = subtotal - discount + tax;
    const paid = Number(paidAmount || 0);
    const remaining = Math.max(total - paid, 0);

    return { subtotal, discount, tax, total, paid, remaining };
  }, [items, paidAmount]);

  const addProduct = () => {
    if (!selectedProduct) {
      setError('Select a product to add');
      return;
    }

    const product = products.find((entry) => entry._id === selectedProduct);
    if (!product) {
      setError('Product not found');
      return;
    }

    const nextQuantity = Number(quantity || 0);
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    const existingIndex = items.findIndex((item) => item.productId === product._id);
    const itemPayload = {
      productId: product._id,
      name: product.name,
      quantity: nextQuantity,
      costPrice: Number(product.costPrice || 0),
      discount: 0,
      tax: 0,
    };

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex] = itemPayload;
      setItems(updatedItems);
    } else {
      setItems((current) => [...current, itemPayload]);
    }

    setSelectedProduct('');
    setQuantity('1');
    setError('');
  };

  const handleItemChange = (productId, field, value) => {
    setItems((current) => current.map((item) => (
      item.productId === productId ? { ...item, [field]: field === 'quantity' ? Number(value || 0) : Number(value || 0) } : item
    )));
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const handleCreatePurchase = async (event) => {
    event.preventDefault();

    if (!supplierId) {
      setError('Select a supplier');
      return;
    }

    if (!items.length) {
      setError('Add at least one product');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        supplierId,
        paidAmount: Number(paidAmount || 0),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          discount: Number(item.discount || 0),
          tax: Number(item.tax || 0),
        })),
      };

      const response = await axios.post(`${API_URL}/purchases`, payload, { headers: getAuthHeaders() });
      const purchaseId = response.data?.data?._id;
      setSupplierId('');
      setPaidAmount('0');
      setItems([]);
      navigate(`/purchases/${purchaseId}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create purchase');
    } finally {
      setSaving(false);
    }
  };

  if (route === '/purchases/create') {
    return (
      <div className="erp-page-stack">
        <section className="erp-page-header">
          <div>
            <p className="erp-page-kicker">Procurement</p>
            <h2>Create purchase</h2>
          </div>
          <div className="erp-toolbar">
            <Button type="button" variant="secondary" onClick={() => navigate('/purchases')}>Back to purchases</Button>
          </div>
        </section>

        <Card title="Supplier and products" subtitle="Validate supplier and product data on the backend before saving.">
          <form className="erp-form" onSubmit={handleCreatePurchase}>
            <div className="erp-form-grid">
              <Select
                label="Supplier"
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                options={suppliers.map((supplier) => ({ value: supplier._id, label: supplier.name }))}
              />
              <Input label="Paid amount" type="number" min="0" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} />
            </div>

            <div className="erp-form-grid">
              <Input label="Search products" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search by name or SKU" />
              <Select
                label="Product"
                value={selectedProduct}
                onChange={(event) => setSelectedProduct(event.target.value)}
                options={filteredProducts.map((product) => ({ value: product._id, label: `${product.name} (${product.sku})` }))}
              />
              <Input label="Quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              <Button type="button" variant="secondary" onClick={addProduct}>Add product</Button>
            </div>

            {error ? <div className="erp-alert">{error}</div> : null}

            {items.length > 0 ? (
              <div className="erp-table-wrapper">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Cost</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.productId}>
                        <td>{item.name}</td>
                        <td><Input value={item.quantity} type="number" min="1" onChange={(event) => handleItemChange(item.productId, 'quantity', event.target.value)} /></td>
                        <td>{Number(item.costPrice || 0).toFixed(2)}</td>
                        <td><Input value={item.discount} type="number" min="0" step="0.01" onChange={(event) => handleItemChange(item.productId, 'discount', event.target.value)} /></td>
                        <td><Input value={item.tax} type="number" min="0" step="0.01" onChange={(event) => handleItemChange(item.productId, 'tax', event.target.value)} /></td>
                        <td>{((Number(item.quantity || 0) * Number(item.costPrice || 0)) - Number(item.discount || 0) + Number(item.tax || 0)).toFixed(2)}</td>
                        <td><Button type="button" variant="danger" onClick={() => removeItem(item.productId)}>Remove</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="erp-form-grid" style={{ marginTop: '1rem' }}>
              <div className="erp-field"><span className="erp-field-label">Subtotal</span><div className="erp-input">{lineSummary.subtotal.toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Discount</span><div className="erp-input">{lineSummary.discount.toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-input">Tax</span><div className="erp-input">{lineSummary.tax.toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Total</span><div className="erp-input">{lineSummary.total.toFixed(2)}</div></div>
            </div>

            <div className="erp-form-actions">
              <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create purchase'}</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (route && route !== '/purchases' && !route.startsWith('/purchases/')) {
    return null;
  }

  if (route && route.startsWith('/purchases/') && route !== '/purchases/create') {
    const isInvoiceView = route.endsWith('/invoice');

    if (!purchase) {
      return (
        <div className="erp-page-stack">
          <Card>
            {loading ? <Loading message="Loading purchase details..." /> : <EmptyState title="Purchase not found" description="The selected purchase could not be loaded." />}
          </Card>
        </div>
      );
    }

    if (isInvoiceView) {
      return (
        <div className="erp-page-stack" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <section className="erp-page-header">
            <div>
              <p className="erp-page-kicker">Procurement</p>
              <h2>Invoice</h2>
            </div>
            <div className="erp-toolbar">
              <Button type="button" variant="secondary" onClick={() => navigate('/purchases')}>Back to purchases</Button>
              <Button type="button" onClick={() => window.print()}>Print</Button>
            </div>
          </section>

          <Card title={purchase.purchaseNumber} subtitle="Printable purchase invoice">
            <div className="erp-form-grid">
              <div className="erp-field"><span className="erp-field-label">Supplier</span><div className="erp-input">{purchase.supplier?.name || '—'}</div></div>
              <div className="erp-field"><span className="erp-field-label">Purchase #</span><div className="erp-input">{purchase.purchaseNumber}</div></div>
              <div className="erp-field"><span className="erp-field-label">Date</span><div className="erp-input">{new Date(purchase.createdAt).toLocaleString()}</div></div>
              <div className="erp-field"><span className="erp-field-label">Status</span><div className="erp-input"><Badge tone={getPaymentStatusTone(purchase.paymentStatus)}>{purchase.paymentStatus}</Badge></div></div>
              <div className="erp-field"><span className="erp-field-label">Subtotal</span><div className="erp-input">{Number(purchase.subtotal || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Discount</span><div className="erp-input">{Number(purchase.discount || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Tax</span><div className="erp-input">{Number(purchase.tax || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Total</span><div className="erp-input">{Number(purchase.totalAmount || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Paid</span><div className="erp-input">{Number(purchase.paidAmount || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Remaining</span><div className="erp-input">{Number(purchase.remainingAmount || 0).toFixed(2)}</div></div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <Table
                columns={[
                  { key: 'productName', label: 'Product' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'costPrice', label: 'Cost' },
                  { key: 'discount', label: 'Discount' },
                  { key: 'tax', label: 'Tax' },
                  { key: 'total', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
                ]}
                rows={(purchase.items || []).map((item) => ({
                  id: item._id,
                  productName: item.product?.name || 'Unknown product',
                  quantity: item.quantity,
                  costPrice: Number(item.costPrice || 0).toFixed(2),
                  discount: Number(item.discount || 0).toFixed(2),
                  tax: Number(item.tax || 0).toFixed(2),
                  total: Number(item.total || 0).toFixed(2),
                }))}
              />
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="erp-page-stack">
        <section className="erp-page-header">
          <div>
            <p className="erp-page-kicker">Procurement</p>
            <h2>{purchase.purchaseNumber}</h2>
          </div>
          <div className="erp-toolbar">
            <Button type="button" variant="secondary" onClick={() => navigate('/purchases')}>Back to purchases</Button>
            <Button type="button" onClick={() => navigate(`/purchases/${purchase._id}/invoice`)}>Invoice</Button>
          </div>
        </section>

        <Card title="Purchase summary" subtitle="Server-calculated totals and payment status.">
          <div className="erp-form-grid">
            <div className="erp-field"><span className="erp-field-label">Supplier</span><div className="erp-input">{purchase.supplier?.name || '—'}</div></div>
            <div className="erp-field"><span className="erp-field-label">Status</span><div className="erp-input"><Badge tone={getPaymentStatusTone(purchase.paymentStatus)}>{purchase.paymentStatus}</Badge></div></div>
            <div className="erp-field"><span className="erp-field-label">Subtotal</span><div className="erp-input">{Number(purchase.subtotal || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Discount</span><div className="erp-input">{Number(purchase.discount || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Tax</span><div className="erp-input">{Number(purchase.tax || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Total</span><div className="erp-input">{Number(purchase.totalAmount || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Paid</span><div className="erp-input">{Number(purchase.paidAmount || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Remaining</span><div className="erp-input">{Number(purchase.remainingAmount || 0).toFixed(2)}</div></div>
          </div>
        </Card>

        <Card title="Purchase items" subtitle="All line items and inventory impact are recorded from the backend.">
          <Table
            columns={[
              { key: 'productName', label: 'Product' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'costPrice', label: 'Cost' },
              { key: 'discount', label: 'Discount' },
              { key: 'tax', label: 'Tax' },
              { key: 'total', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
            ]}
            rows={(purchase.items || []).map((item) => ({
              id: item._id,
              productName: item.product?.name || 'Unknown product',
              quantity: item.quantity,
              costPrice: Number(item.costPrice || 0).toFixed(2),
              discount: Number(item.discount || 0).toFixed(2),
              tax: Number(item.tax || 0).toFixed(2),
              total: Number(item.total || 0).toFixed(2),
            }))}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Procurement</p>
          <h2>Purchases</h2>
        </div>
        <div className="erp-toolbar">
          <Button type="button" onClick={() => navigate('/purchases/create')}>New purchase</Button>
        </div>
      </section>

      <Card title="Search and filter" subtitle="Filter purchases by supplier, payment status, or free-text search.">
        <div className="erp-form-grid">
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by number or supplier" />
          <Select
            label="Supplier"
            value={supplierFilter}
            onChange={(event) => setSupplierFilter(event.target.value)}
            options={[{ value: 'all', label: 'All suppliers' }, ...suppliers.map((supplier) => ({ value: supplier._id, label: supplier.name }))]}
          />
          <Select
            label="Payment status"
            value={paymentStatusFilter}
            onChange={(event) => setPaymentStatusFilter(event.target.value)}
            options={[
              { value: 'all', label: 'All payment statuses' },
              { value: 'PAID', label: 'Paid' },
              { value: 'PARTIAL', label: 'Partial' },
              { value: 'UNPAID', label: 'Unpaid' },
            ]}
          />
        </div>
      </Card>

      <Card title="Purchase list" subtitle="Recent purchase records from the ERP system.">
        {loading ? (
          <Loading message="Loading purchases..." />
        ) : purchases.length === 0 ? (
          <EmptyState title="No purchases found" description="Create a new purchase to begin receiving stock." />
        ) : (
          <>
            <Table
              columns={[
                { key: 'purchaseNumber', label: 'Purchase #' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'totalAmount', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
                { key: 'paidAmount', label: 'Paid', render: (value) => Number(value || 0).toFixed(2) },
                { key: 'paymentStatus', label: 'Payment', render: (value) => <Badge tone={getPaymentStatusTone(value)}>{value}</Badge> },
                { key: 'createdAt', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
              ]}
              rows={purchases.map((purchaseRecord) => ({
                id: purchaseRecord._id,
                purchaseNumber: purchaseRecord.purchaseNumber,
                supplier: purchaseRecord.supplier?.name || '—',
                totalAmount: purchaseRecord.totalAmount,
                paidAmount: purchaseRecord.paidAmount,
                paymentStatus: purchaseRecord.paymentStatus,
                createdAt: purchaseRecord.createdAt,
              }))}
            />
            <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => { setPage(nextPage); fetchPurchases(nextPage); }} />
          </>
        )}
      </Card>
    </div>
  );
}
