import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, Input, Loading, Pagination, Select, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

export function PaymentPage({ route, navigate }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [method, setMethod] = useState('all');
  const [referenceType, setReferenceType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchPayments = async (nextPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
      if (method !== 'all') params.set('method', method);
      if (referenceType !== 'all') params.set('referenceType', referenceType);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const response = await axios.get(`${API_URL}/payments?${params.toString()}`, { headers: getAuthHeaders() });
      const payload = response.data?.data || {};
      setPayments(payload.items || []);
      setTotalPages(payload.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [method, referenceType, fromDate, toDate]);

  if (route && route.startsWith('/payments/')) {
    return (
      <div className="erp-page-stack">
        <section className="erp-page-header">
          <div>
            <p className="erp-page-kicker">Finance</p>
            <h2>Payment detail</h2>
          </div>
          <div className="erp-toolbar">
            <Button type="button" variant="secondary" onClick={() => navigate('/payments')}>Back to payments</Button>
          </div>
        </section>
        <Card>
          <EmptyState title="Payment detail view" description="Detailed payment record presentation can be expanded here in the finance module." />
        </Card>
      </div>
    );
  }

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div>
          <p className="erp-page-kicker">Finance</p>
          <h2>Payments</h2>
        </div>
      </section>

      <Card title="Filter ledger" subtitle="Review transactions by payment method, reference type, and date range.">
        <div className="erp-form-grid">
          <Select label="Payment method" value={method} onChange={(event) => setMethod(event.target.value)} options={[{ value: 'all', label: 'All methods' }, { value: 'CASH', label: 'Cash' }, { value: 'CARD', label: 'Card' }, { value: 'BANK_TRANSFER', label: 'Bank transfer' }, { value: 'ONLINE', label: 'Online' }]} />
          <Select label="Reference type" value={referenceType} onChange={(event) => setReferenceType(event.target.value)} options={[{ value: 'all', label: 'All references' }, { value: 'SALE', label: 'Sale' }, { value: 'PURCHASE', label: 'Purchase' }, { value: 'REFUND', label: 'Refund' }]} />
          <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
      </Card>

      <Card title="Payment history" subtitle="Ledger of all payment and refund activity.">
        {loading ? (
          <Loading message="Loading payment history..." />
        ) : payments.length === 0 ? (
          <EmptyState title="No payments found" description="No payment records match the current filters." />
        ) : (
          <>
            <Table
              columns={[
                { key: 'referenceType', label: 'Ref.' },
                { key: 'referenceId', label: 'Reference ID' },
                { key: 'amount', label: 'Amount', render: (value) => Number(value || 0).toFixed(2) },
                { key: 'paymentMethod', label: 'Method' },
                { key: 'paymentType', label: 'Type' },
                { key: 'createdAt', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
              ]}
              rows={payments.map((payment) => ({
                id: payment._id,
                referenceType: payment.referenceType,
                referenceId: payment.referenceId,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                paymentType: payment.paymentType,
                createdAt: payment.createdAt,
              }))}
            />
            <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => { setPage(nextPage); fetchPayments(nextPage); }} />
          </>
        )}
      </Card>
    </div>
  );
}
