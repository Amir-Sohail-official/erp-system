import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading, Modal, Pagination, Select, Table } from './ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const initialForm = { name: '', email: '', password: '', phone: '', role: '', isActive: true };

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('erp_token')}` });
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';
const hasPermission = (user, permission) => user?.role?.permissions?.includes(permission) || user?.role?.name === 'Admin';

export function UsersPage({ user }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', active: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingUser, setEditingUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const assignableRoles = useMemo(() => roles.filter((role) => {
    const permissions = new Set(user?.role?.permissions || []);
    return role.permissions?.every((permission) => permissions.has(permission));
  }), [roles, user]);

  const fetchUsers = async (page = pagination.page) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`, {
        headers: headers(),
        params: { page, limit: 10, ...filters },
      });
      const data = response.data?.data || {};
      setUsers(data.items || []);
      setRoles(data.roles || []);
      setPagination(data.pagination || { page, totalPages: 1, total: 0 });
      setError('');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [filters.search, filters.role, filters.active]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ ...initialForm, role: assignableRoles[0]?._id || '' });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (selectedUser) => {
    setEditingUser(selectedUser);
    setForm({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      password: '',
      phone: selectedUser.phone || '',
      role: selectedUser.role?._id || '',
      isActive: selectedUser.isActive,
    });
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (!saving) {
      setEditingUser(null);
      setFormOpen(false);
    }
  };

  const validate = () => {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address';
    if (!editingUser && form.password.length < 8) return 'Password must be at least 8 characters';
    if (!form.role) return 'Select a role';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const payload = { name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), role: form.role };
      if (editingUser) payload.isActive = form.isActive;
      else payload.password = form.password;

      if (editingUser) await axios.put(`${API_URL}/users/${editingUser._id}`, payload, { headers: headers() });
      else await axios.post(`${API_URL}/users`, payload, { headers: headers() });
      setEditingUser(null);
      setFormOpen(false);
      await fetchUsers(editingUser ? pagination.page : 1);
    } catch (requestError) {
      setFormError(requestError?.response?.data?.message || 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (selectedUser) => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/users/${selectedUser._id}`, { isActive: !selectedUser.isActive }, { headers: headers() });
      await fetchUsers(pagination.page);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to change user status');
    } finally {
      setSaving(false);
    }
  };

  const deactivateUser = async (selectedUser) => {
    if (!window.confirm(`Deactivate ${selectedUser.name}? They will no longer be able to log in.`)) return;
    try {
      setSaving(true);
      await axios.delete(`${API_URL}/users/${selectedUser._id}`, { headers: headers() });
      await fetchUsers(pagination.page);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to deactivate user');
    } finally {
      setSaving(false);
    }
  };

  const canCreate = hasPermission(user, 'users.create');
  const canUpdate = hasPermission(user, 'users.update');
  const canDelete = hasPermission(user, 'users.delete');
  const formRoleOptions = assignableRoles.map((role) => ({ value: role._id, label: role.name }));

  return (
    <div className="erp-page-stack">
      <section className="erp-page-header">
        <div><p className="erp-page-kicker">Administration</p><h2>Users</h2></div>
        {canCreate ? <Button type="button" onClick={openCreate}>Add User</Button> : null}
      </section>

      <Card title="User directory" subtitle={`${pagination.total || 0} accounts in the system`}>
        <div className="erp-user-filters">
          <Input label="Search" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Name, email or phone" />
          <Select label="Role" value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))} options={[{ value: '', label: 'All roles' }, ...roles.map((role) => ({ value: role._id, label: role.name }))]} />
          <Select label="Status" value={filters.active} onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))} options={[{ value: '', label: 'All statuses' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
        </div>
        {error ? <div className="erp-alert">{error}</div> : null}
        {loading ? <Loading message="Loading users..." /> : users.length === 0 ? (
          <EmptyState title={filters.search || filters.role || filters.active ? 'No matching users' : 'No users available'} description={filters.search || filters.role || filters.active ? 'Try changing the search or filters.' : 'Create the first user to begin managing access.'} />
        ) : (
          <>
            <Table columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'role', label: 'Role', render: (value) => value?.name || 'No role' },
              { key: 'isActive', label: 'Status', render: (value) => <Badge tone={value ? 'success' : 'secondary'}>{value ? 'Active' : 'Inactive'}</Badge> },
              { key: 'createdAt', label: 'Created', render: (value) => formatDate(value) },
              { key: 'actions', label: 'Actions', render: (_, row) => <div className="erp-table-actions">
                {canUpdate ? <Button type="button" variant="secondary" onClick={() => openEdit(row)}>Edit</Button> : null}
                {canUpdate ? <Button type="button" variant="ghost" disabled={saving} onClick={() => toggleStatus(row)}>{row.isActive ? 'Deactivate' : 'Activate'}</Button> : null}
                {canDelete && row.isActive ? <Button type="button" variant="danger" disabled={saving} onClick={() => deactivateUser(row)}>Delete</Button> : null}
              </div> },
            ]} rows={users.map((item) => ({ ...item, id: item._id }))} />
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(nextPage) => fetchUsers(nextPage)} />
          </>
        )}
      </Card>

      <Modal open={formOpen} onClose={closeForm} title={editingUser ? 'Edit user' : 'Add user'} footer={null}>
        <form className="erp-form" onSubmit={handleSubmit}>
          <div className="erp-form-grid">
            <Input label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" />
            <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@company.com" />
            {!editingUser ? <Input label="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" /> : null}
            <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Optional phone" />
            <Select label="Role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} options={formRoleOptions} />
            {editingUser ? <Select label="Status" value={String(form.isActive)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'true' }))} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} /> : null}
          </div>
          {formError ? <div className="erp-alert">{formError}</div> : null}
          <div className="erp-form-actions"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingUser ? 'Update user' : 'Create user'}</Button><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button></div>
        </form>
      </Modal>
    </div>
  );
}
