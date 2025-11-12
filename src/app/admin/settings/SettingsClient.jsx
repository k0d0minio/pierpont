"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/button';
import { Input } from '../../../../components/input';
import { Heading, Subheading } from '../../../../components/heading';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '../../../../components/dialog';
import { createPOC, updatePOC, deletePOC, getAllPOCs, createVenueType, updateVenueType, deleteVenueType, getAllVenueTypes } from './actions';

export default function SettingsClient({ initialPOCs = [], initialVenueTypes = [], appVersion = '0.1.0' }) {
  const router = useRouter();
  const [pocs, setPocs] = useState(initialPOCs);
  const [venueTypes, setVenueTypes] = useState(initialVenueTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // POC form state
  const [isPOCModalOpen, setIsPOCModalOpen] = useState(false);
  const [editingPOC, setEditingPOC] = useState(null);
  const [pocFormData, setPocFormData] = useState({
    name: '',
    role: '',
    phoneNumber: '',
    email: '',
  });

  // Venue Type form state
  const [isVenueTypeModalOpen, setIsVenueTypeModalOpen] = useState(false);
  const [editingVenueType, setEditingVenueType] = useState(null);
  const [venueTypeFormData, setVenueTypeFormData] = useState({
    name: '',
    code: '',
  });

  // System info state
  const [dbStatus, setDbStatus] = useState('checking');

  // Check database connection status
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const result = await getAllPOCs();
        setDbStatus(result.ok ? 'connected' : 'error');
      } catch (err) {
        setDbStatus('error');
      }
    };
    checkDbStatus();
  }, []);

  // Refresh POCs list
  const refreshPOCs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getAllPOCs();
      if (result.ok) {
        setPocs(result.data || []);
      } else {
        setError(result.error || 'Failed to load POCs');
      }
    } catch (err) {
      setError('Failed to load POCs');
    } finally {
      setIsLoading(false);
    }
  };

  // Open create POC modal
  const handleCreatePOC = () => {
    setEditingPOC(null);
    setPocFormData({ name: '', role: '', phoneNumber: '', email: '' });
    setError('');
    setSuccess('');
    setIsPOCModalOpen(true);
  };

  // Open edit POC modal
  const handleEditPOC = (poc) => {
    setEditingPOC(poc);
    setPocFormData({
      name: poc.name || '',
      role: poc.role || '',
      phoneNumber: poc.phoneNumber || '',
      email: poc.email || '',
    });
    setError('');
    setSuccess('');
    setIsPOCModalOpen(true);
  };

  // Handle POC form submit
  const handlePOCSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', pocFormData.name);
      formData.append('role', pocFormData.role);
      formData.append('phoneNumber', pocFormData.phoneNumber);
      formData.append('email', pocFormData.email);

      let result;
      if (editingPOC) {
        formData.append('id', editingPOC.id);
        result = await updatePOC(formData);
      } else {
        result = await createPOC(formData);
      }

      if (result.ok) {
        setSuccess(editingPOC ? 'POC updated successfully' : 'POC created successfully');
        setIsPOCModalOpen(false);
        await refreshPOCs();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save POC');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete POC
  const handleDeletePOC = async (poc) => {
    if (!confirm(`Are you sure you want to delete "${poc.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('id', poc.id);
      const result = await deletePOC(formData);

      if (result.ok) {
        setSuccess('POC deleted successfully');
        await refreshPOCs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to delete POC');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh Venue Types list
  const refreshVenueTypes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getAllVenueTypes();
      if (result.ok) {
        setVenueTypes(result.data || []);
      } else {
        setError(result.error || 'Failed to load venue types');
      }
    } catch (err) {
      setError('Failed to load venue types');
    } finally {
      setIsLoading(false);
    }
  };

  // Open create Venue Type modal
  const handleCreateVenueType = () => {
    setEditingVenueType(null);
    setVenueTypeFormData({ name: '', code: '' });
    setError('');
    setSuccess('');
    setIsVenueTypeModalOpen(true);
  };

  // Open edit Venue Type modal
  const handleEditVenueType = (venueType) => {
    setEditingVenueType(venueType);
    setVenueTypeFormData({
      name: venueType.name || '',
      code: venueType.code || '',
    });
    setError('');
    setSuccess('');
    setIsVenueTypeModalOpen(true);
  };

  // Handle Venue Type form submit
  const handleVenueTypeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', venueTypeFormData.name);
      if (venueTypeFormData.code) {
        formData.append('code', venueTypeFormData.code);
      }

      let result;
      if (editingVenueType) {
        formData.append('id', editingVenueType.id);
        result = await updateVenueType(formData);
      } else {
        result = await createVenueType(formData);
      }

      if (result.ok) {
        setSuccess(editingVenueType ? 'Venue type updated successfully' : 'Venue type created successfully');
        setIsVenueTypeModalOpen(false);
        await refreshVenueTypes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save venue type');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete Venue Type
  const handleDeleteVenueType = async (venueType) => {
    if (!confirm(`Are you sure you want to delete "${venueType.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('id', venueType.id);
      const result = await deleteVenueType(formData);

      if (result.ok) {
        setSuccess('Venue type deleted successfully');
        await refreshVenueTypes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to delete venue type');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">{success}</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* POC Management Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Subheading level={2}>Points of Contact</Subheading>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage points of contact used in entries
            </p>
          </div>
          <Button onClick={handleCreatePOC} color="emerald">
            Add POC
          </Button>
        </div>

        {/* POCs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
              {pocs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No points of contact found. Click "Add POC" to create one.
                  </td>
                </tr>
              ) : (
                pocs.map((poc) => (
                  <tr key={poc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {poc.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {poc.role || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {poc.phoneNumber || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {poc.email || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(poc.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          plain
                          onClick={() => handleEditPOC(poc)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </Button>
                        <Button
                          plain
                          onClick={() => handleDeletePOC(poc)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Venue Type Management Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Subheading level={2}>Venue Types</Subheading>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage venue types used in entries
            </p>
          </div>
          <Button onClick={handleCreateVenueType} color="emerald">
            Add Venue Type
          </Button>
        </div>

        {/* Venue Types Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
              {venueTypes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No venue types found. Click "Add Venue Type" to create one.
                  </td>
                </tr>
              ) : (
                venueTypes.map((venueType) => (
                  <tr key={venueType.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {venueType.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {venueType.code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(venueType.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          plain
                          onClick={() => handleEditVenueType(venueType)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </Button>
                        <Button
                          plain
                          onClick={() => handleDeleteVenueType(venueType)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* System Information Section */}
      <section>
        <Subheading level={2}>System Information</Subheading>
        <div className="mt-4 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Application Version</dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{appVersion}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Database Status</dt>
                <dd className="mt-1 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dbStatus === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : dbStatus === 'checking'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {dbStatus === 'connected' ? 'Connected' : dbStatus === 'checking' ? 'Checking...' : 'Error'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Site URL</dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {process.env.NEXT_PUBLIC_SITE_URL || 'Not configured'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Supabase URL</dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
                    : 'Not configured'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* POC Create/Edit Modal */}
      <Dialog open={isPOCModalOpen} onClose={() => !isLoading && setIsPOCModalOpen(false)}>
        <DialogTitle>{editingPOC ? 'Edit Point of Contact' : 'Add Point of Contact'}</DialogTitle>
        <form onSubmit={handlePOCSubmit}>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label htmlFor="poc-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </label>
                <Input
                  id="poc-name"
                  type="text"
                  value={pocFormData.name}
                  onChange={(e) => setPocFormData({ ...pocFormData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="poc-role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Role
                </label>
                <Input
                  id="poc-role"
                  type="text"
                  value={pocFormData.role}
                  onChange={(e) => setPocFormData({ ...pocFormData, role: e.target.value })}
                  placeholder="e.g., Event Coordinator"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="poc-phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </label>
                <Input
                  id="poc-phone"
                  type="tel"
                  value={pocFormData.phoneNumber}
                  onChange={(e) => setPocFormData({ ...pocFormData, phoneNumber: e.target.value })}
                  placeholder="e.g., +32 123 456 789"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="poc-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <Input
                  id="poc-email"
                  type="email"
                  value={pocFormData.email}
                  onChange={(e) => setPocFormData({ ...pocFormData, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                  className="w-full"
                />
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              type="button"
              plain
              onClick={() => setIsPOCModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" color="emerald" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingPOC ? 'Update POC' : 'Create POC'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Venue Type Create/Edit Modal */}
      <Dialog open={isVenueTypeModalOpen} onClose={() => !isLoading && setIsVenueTypeModalOpen(false)}>
        <DialogTitle>{editingVenueType ? 'Edit Venue Type' : 'Add Venue Type'}</DialogTitle>
        <form onSubmit={handleVenueTypeSubmit}>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label htmlFor="venue-type-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </label>
                <Input
                  id="venue-type-name"
                  type="text"
                  value={venueTypeFormData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setVenueTypeFormData({ 
                      ...venueTypeFormData, 
                      name,
                      code: editingVenueType ? venueTypeFormData.code : (venueTypeFormData.code || name.toLowerCase().replace(/\s+/g, '-'))
                    });
                  }}
                  placeholder="e.g., Events Hall"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="venue-type-code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Code
                </label>
                <Input
                  id="venue-type-code"
                  type="text"
                  value={venueTypeFormData.code}
                  onChange={(e) => setVenueTypeFormData({ ...venueTypeFormData, code: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g., events-hall (auto-generated from name)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Code is auto-generated from name if not provided. Used internally for references.
                </p>
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              type="button"
              plain
              onClick={() => setIsVenueTypeModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" color="emerald" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingVenueType ? 'Update Venue Type' : 'Create Venue Type'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

