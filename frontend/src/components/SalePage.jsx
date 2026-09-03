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

const emptyCart = [];

export function SalePage({ user, route, navigate }) {
  const [sales, setSales] = useState([]);
  const [sale, setSale] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cart, setCart] = useState(emptyCart);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers?limit=200`, { headers: getAuthHeaders() });
      setCustomers(response.data?.data?.items || []);
    } catch (error) {
      console.error('Unable to load customers', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?limit=200`, { headers: getAuthHeaders() });
      const productList = response.data?.data?.items || [];
      setProducts(productList);
      setSelectedProduct((current) => current || productList[0]?._id || '');
    } catch (error) {
      console.error('Unable to load products', error);
    }
  };

  const fetchSales = async (nextPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
      if (search.trim()) params.set('search', search.trim());
      if (customerFilter !== 'all') params.set('customer', customerFilter);
      if (paymentStatusFilter !== 'all') params.set('paymentStatus', paymentStatusFilter);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const response = await axios.get(`${API_URL}/sales?${params.toString()}`, { headers: getAuthHeaders() });
      const payload = response.data?.data || {};
      setSales(payload.items || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetail = async (saleId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/sales/${saleId}`, { headers: getAuthHeaders() });
      setSale(response.data?.data || null);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load sale');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    if (route === '/sales' || route === undefined) {
      fetchSales(1);
    }
  }, [route, search, customerFilter, paymentStatusFilter, fromDate, toDate]);

  useEffect(() => {
    if (route && route.startsWith('/sales/') && route !== '/sales/pos' && route !== '/sales') {
      const parts = route.split('/').filter(Boolean);
      const saleId = parts[1];
      if (saleId) {
        fetchSaleDetail(saleId);
      }
    }
  }, [route]);

  const filteredProducts = useMemo(() => {
    const term = debouncedProductSearch.toLowerCase();
    return products.filter((product) => {
      if (!term) return true;
      return (
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.barcode?.toLowerCase().includes(term)
      );
    });
  }, [debouncedProductSearch, products]);

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + Number((Number(item.quantity || 0) * Number(item.sellingPrice || 0)).toFixed(2)), 0);
    const discount = cart.reduce((sum, item) => sum + Number(item.discount || 0), 0);
    const tax = cart.reduce((sum, item) => sum + Number(item.tax || 0), 0);
    const total = subtotal - discount + tax;
    const paid = Number(paidAmount || 0);
    const remaining = Math.max(total - paid, 0);

    return { subtotal, discount, tax, total, paid, remaining };
  }, [cart, paidAmount]);

  const addProductToCart = () => {
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

    if (Number(product.stock ?? 0) < nextQuantity) {
      setError(`Insufficient stock for ${product.name}.`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product._id);
    const nextItem = {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      quantity: nextQuantity,
      sellingPrice: Number(product.sellingPrice || 0),
      discount: 0,
      tax: 0,
      availableStock: Number(product.stock || 0),
    };

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex] = nextItem;
      setCart(updated);
    } else {
      setCart((current) => [...current, nextItem]);
    }

    setSelectedProduct('');
    setQuantity('1');
    setError('');
  };

  const updateCartItem = (productId, field, value) => {
    setCart((current) => current.map((item) => {
      if (item.productId !== productId) return item;
      const numericValue = Number(value || 0);
      if (field === 'quantity') {
        const nextQuantity = Math.max(1, numericValue);
        return { ...item, quantity: nextQuantity };
      }
      return { ...item, [field]: numericValue };
    }));
  };

  const removeCartItem = (productId) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart(emptyCart);
    setPaidAmount('0');
  };

  const handleCompleteSale = async () => {
    if (!cart.length) {
      setError('Add at least one product to the cart');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        customerId: customerId || null,
        paymentMethod,
        paidAmount: Number(paidAmount || 0),
        discount: Number(cartSummary.discount || 0),
        tax: Number(cartSummary.tax || 0),
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
          discount: Number(item.discount || 0),
          tax: Number(item.tax || 0),
        })),
      };

      const response = await axios.post(`${API_URL}/sales`, payload, { headers: getAuthHeaders() });
      const saleId = response.data?.data?._id;
      setCustomerId('');
      setPaymentMethod('CASH');
      setPaidAmount('0');
      setCart(emptyCart);
      navigate(`/sales/${saleId}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create sale');
    } finally {
      setSaving(false);
    }
  };

  if (route === '/sales/pos') {
    return (
      <div className="erp-page-stack">
        <section className="erp-page-header">
          <div>
            <p className="erp-page-kicker">Point of Sale</p>
            <h2>Sales POS</h2>
          </div>
          <div className="erp-toolbar">
            <Button type="button" variant="secondary" onClick={() => navigate('/sales')}>Back to sales</Button>
          </div>
        </section>

        <div className="erp-pos-layout">
          <Card title="Product search" subtitle="Search by name, SKU, or barcode.">
            <div className="erp-form-grid">
              <Input label="Search products" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products" />
              <Select
                label="Selected product"
                value={selectedProduct}
                onChange={(event) => setSelectedProduct(event.target.value)}
                options={[{ value: '', label: 'Choose a product' }, ...filteredProducts.map((product) => ({ value: product._id, label: `${product.name} • ${product.sku} • Stock: ${product.stock}` }))]}
              />
              <Input label="Quantity" type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              <Button type="button" disabled={!selectedProduct} onClick={addProductToCart}>Add to cart</Button>
            </div>
          </Card>

          <Card title="Cart" subtitle="Review line items before finalizing the sale.">
            {cart.length === 0 ? (
              <EmptyState title="Cart is empty" description="Search and add a product to begin a sale." />
            ) : (
              <div className="erp-table-wrapper">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Disc</th>
                      <th>Tax</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId}>
                        <td>{item.name}</td>
                        <td><Input value={item.quantity} type="number" min="1" onChange={(event) => updateCartItem(item.productId, 'quantity', event.target.value)} /></td>
                        <td>{Number(item.sellingPrice || 0).toFixed(2)}</td>
                        <td><Input value={item.discount} type="number" min="0" step="0.01" onChange={(event) => updateCartItem(item.productId, 'discount', event.target.value)} /></td>
                        <td><Input value={item.tax} type="number" min="0" step="0.01" onChange={(event) => updateCartItem(item.productId, 'tax', event.target.value)} /></td>
                        <td>{((Number(item.quantity || 0) * Number(item.sellingPrice || 0)) - Number(item.discount || 0) + Number(item.tax || 0)).toFixed(2)}</td>
                        <td><Button type="button" variant="danger" onClick={() => removeCartItem(item.productId)}>Remove</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="erp-form-actions">
                  <Button type="button" variant="secondary" onClick={clearCart}>Clear cart</Button>
                </div>
              </div>
            )}
          </Card>

          <Card title="Customer and payment" subtitle="Finalize the sale with customer and payment details.">
            <div className="erp-form-grid">
              <Select
                label="Customer"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                options={[{ value: '', label: 'Walk-in customer' }, ...customers.map((customer) => ({ value: customer._id, label: `${customer.name} (${customer.phone || 'No phone'})` }))]}
              />
              <Select
                label="Payment method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Input label="Amount paid" type="number" min="0" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} />
            </div>

            <div className="erp-form-grid" style={{ marginTop: '1rem' }}>
              <div className="erp-field"><span className="erp-field-label">Subtotal</span><div className="erp-input">{cartSummary.subtotal.toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Discount</span><div className="erp-input">{cartSummary.discount.toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Tax</span><div className="erp-input">{cartSummary.tax.toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Total</span><div className="erp-input">{cartSummary.total.toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Remaining</span><div className="erp-input">{cartSummary.remaining.toFixed(2)}</div></div>
            </div>

            {error ? <div className="erp-alert" style={{ marginTop: '1rem' }}>{error}</div> : null}

            <div className="erp-form-actions" style={{ marginTop: '1rem' }}>
              <Button type="button" disabled={saving || !cart.length} onClick={handleCompleteSale}>{saving ? 'Processing...' : 'Complete sale'}</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (route && route !== '/sales' && !route.startsWith('/sales/')) {
    return null;
  }

  if (route && route.startsWith('/sales/') && route !== '/sales/pos' && route !== '/sales') {
    const isInvoiceView = route.endsWith('/invoice');

    if (!sale) {
      return (
        <div className="erp-page-stack">
          <Card>
            {loading ? <Loading message="Loading sale details..." /> : <EmptyState title="Sale not found" description="The selected sale could not be loaded." />}
          </Card>
        </div>
      );
    }

    if (isInvoiceView) {
      return (
        <div className="erp-page-stack" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <section className="erp-page-header">
            <div>
              <p className="erp-page-kicker">Sales</p>
              <h2>Invoice</h2>
            </div>
            <div className="erp-toolbar">
              <Button type="button" variant="secondary" onClick={() => navigate('/sales')}>Back to sales</Button>
              <Button type="button" onClick={() => window.print()}>Print</Button>
            </div>
          </section>

          <Card title={sale.invoiceNumber} subtitle="Printable sales invoice">
            <div className="erp-form-grid">
              <div className="erp-field"><span className="erp-field-label">Company</span><div className="erp-input">ERP System</div></div>
              <div className="erp-field"><span className="erp-field-label">Invoice</span><div className="erp-input">{sale.invoiceNumber}</div></div>
              <div className="erp-field"><span className="erp-field-label">Date</span><div className="erp-input">{new Date(sale.createdAt).toLocaleString()}</div></div>
              <div className="erp-field"><span className="erp-field-label">Customer</span><div className="erp-input">{sale.customer?.name || 'Walk-in customer'}</div></div>
              <div className="erp-field"><span className="erp-field-label">Subtotal</span><div className="erp-input">{Number(sale.subtotal || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Discount</span><div className="erp-input">{Number(sale.discount || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Tax</span><div className="erp-input">{Number(sale.tax || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Total</span><div className="erp-input">{Number(sale.totalAmount || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Paid</span><div className="erp-input">{Number(sale.paidAmount || 0).toFixed(2)}</div></div>
              <div className="erp-field"><span className="erp-field-label">Remaining</span><div className="erp-input">{Number(sale.remainingAmount || 0).toFixed(2)}</div></div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <Table
                columns={[
                  { key: 'productName', label: 'Product' },
                  { key: 'quantity', label: 'Qty' },
                  { key: 'sellingPrice', label: 'Price', render: (value) => Number(value || 0).toFixed(2) },
                  { key: 'discount', label: 'Discount', render: (value) => Number(value || 0).toFixed(2) },
                  { key: 'tax', label: 'Tax', render: (value) => Number(value || 0).toFixed(2) },
                  { key: 'total', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
                ]}
                rows={(sale.items || []).map((item) => ({
                  id: item._id,
                  productName: item.product?.name || 'Product',
                  quantity: item.quantity,
                  sellingPrice: item.sellingPrice,
                  discount: item.discount,
                  tax: item.tax,
                  total: item.total,
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
            <p className="erp-page-kicker">Sales</p>
            <h2>{sale.invoiceNumber}</h2>
          </div>
          <div className="erp-toolbar">
            <Button type="button" variant="secondary" onClick={() => navigate('/sales')}>Back to sales</Button>
            <Button type="button" onClick={() => navigate(`/sales/${sale._id}/invoice`)}>Invoice</Button>
          </div>
        </section>

        <Card title="Receipt" subtitle="Printable sale summary generated by the backend.">
          <div className="erp-form-grid">
            <div className="erp-field"><span className="erp-field-label">Company</span><div className="erp-input">ERP System</div></div>
            <div className="erp-field"><span className="erp-field-label">Invoice</span><div className="erp-input">{sale.invoiceNumber}</div></div>
            <div className="erp-field"><span className="erp-field-label">Date</span><div className="erp-input">{new Date(sale.createdAt).toLocaleString()}</div></div>
            <div className="erp-field"><span className="erp-field-label">Customer</span><div className="erp-input">{sale.customer?.name || 'Walk-in customer'}</div></div>
            <div className="erp-field"><span className="erp-field-label">Subtotal</span><div className="erp-input">{Number(sale.subtotal || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Discount</span><div className="erp-input">{Number(sale.discount || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Tax</span><div className="erp-input">{Number(sale.tax || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Total</span><div className="erp-input">{Number(sale.totalAmount || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Paid</span><div className="erp-input">{Number(sale.paidAmount || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Remaining</span><div className="erp-input">{Number(sale.remainingAmount || 0).toFixed(2)}</div></div>
            <div className="erp-field"><span className="erp-field-label">Status</span><div className="erp-input"><Badge tone={getPaymentStatusTone(sale.paymentStatus)}>{sale.paymentStatus}</Badge></div></div>
          </div>
        </Card>

        <Card title="Products in this sale">
          <Table
            columns={[
              { key: 'productName', label: 'Product' },
              { key: 'quantity', label: 'Qty' },
              { key: 'sellingPrice', label: 'Price', render: (value) => Number(value || 0).toFixed(2) },
              { key: 'discount', label: 'Discount', render: (value) => Number(value || 0).toFixed(2) },
              { key: 'tax', label: 'Tax', render: (value) => Number(value || 0).toFixed(2) },
              { key: 'total', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
            ]}
            rows={(sale.items || []).map((item) => ({
              id: item._id,
              productName: item.product?.name || 'Product',
              quantity: item.quantity,
              sellingPrice: item.sellingPrice,
              discount: item.discount,
              tax: item.tax,
              total: item.total,
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
          <p className="erp-page-kicker">Sales</p>
          <h2>Sales</h2>
        </div>
        <div className="erp-toolbar">
          <Button type="button" onClick={() => navigate('/sales/pos')}>POS</Button>
        </div>
      </section>

      <Card title="Search and filter" subtitle="Filter sales by date, customer, and payment status.">
        <div className="erp-form-grid">
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by invoice" />
          <Select
            label="Customer"
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.target.value)}
            options={[{ value: 'all', label: 'All customers' }, ...customers.map((customer) => ({ value: customer._id, label: customer.name }))]}
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
          <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
      </Card>

      <Card title="Sales list" subtitle="Recent sales and payment activity.">
        {loading ? (
          <Loading message="Loading sales..." />
        ) : sales.length === 0 ? (
          <EmptyState title="No sales found" description="Create a POS sale to begin recording transactions." />
        ) : (
          <>
            <Table
              columns={[
                { key: 'invoiceNumber', label: 'Invoice' },
                { key: 'customer', label: 'Customer' },
                { key: 'createdAt', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                { key: 'totalAmount', label: 'Total', render: (value) => Number(value || 0).toFixed(2) },
                { key: 'paidAmount', label: 'Paid', render: (value) => Number(value || 0).toFixed(2) },
                { key: 'remainingAmount', label: 'Remaining', render: (value) => Number(value || 0).toFixed(2) },
                { key: 'paymentStatus', label: 'Payment', render: (value) => <Badge tone={getPaymentStatusTone(value)}>{value}</Badge> },
                { key: 'createdBy', label: 'Created by' },
              ]}
              rows={sales.map((saleRecord) => ({
                id: saleRecord._id,
                invoiceNumber: saleRecord.invoiceNumber,
                customer: saleRecord.customer?.name || 'Walk-in customer',
                createdAt: saleRecord.createdAt,
                totalAmount: saleRecord.totalAmount,
                paidAmount: saleRecord.paidAmount,
                remainingAmount: saleRecord.remainingAmount,
                paymentStatus: saleRecord.paymentStatus,
                createdBy: saleRecord.createdBy?.name || 'System',
              }))}
            />
            <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => { setPage(nextPage); fetchSales(nextPage); }} />
          </>
        )}
      </Card>
    </div>
  );
}
