"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createVenueType, updateVenueType, deleteVenueType, getAllVenueTypes } from './actions';
import type { VenueType } from '../../../types/supabase';

type VenueProps = {
  initialVenueTypes?: VenueType[];
}

// Zod schema
const venueTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
});

type VenueTypeFormData = z.infer<typeof venueTypeSchema>;

export default function VenueManagement({ initialVenueTypes = [] }: VenueProps) {
  const [venueTypes, setVenueTypes] = useState<VenueType[]>(initialVenueTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Venue Type form state
  const [isVenueTypeModalOpen, setIsVenueTypeModalOpen] = useState(false);
  const [editingVenueType, setEditingVenueType] = useState<VenueType | null>(null);
  const venueTypeForm = useForm<VenueTypeFormData>({
    resolver: zodResolver(venueTypeSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  });

  // Delete confirmation dialog
  const [deleteVenueTypeDialog, setDeleteVenueTypeDialog] = useState<VenueType | null>(null);

  // Watch venue type name to auto-generate code
  const watchedVenueTypeName = venueTypeForm.watch('name');

  useEffect(() => {
    if (!editingVenueType && watchedVenueTypeName) {
      const autoCode = watchedVenueTypeName.toLowerCase().replace(/\s+/g, '-');
      if (!venueTypeForm.getValues('code')) {
        venueTypeForm.setValue('code', autoCode);
      }
    }
  }, [watchedVenueTypeName, editingVenueType, venueTypeForm]);

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
      } catch {
        setError('Failed to load venue types');
      } finally {
      setIsLoading(false);
    }
  };

  // Open create Venue Type modal
  const handleCreateVenueType = () => {
    setEditingVenueType(null);
    venueTypeForm.reset({
      name: '',
      code: '',
    });
    setError('');
    setSuccess('');
    setIsVenueTypeModalOpen(true);
  };

  // Open edit Venue Type modal
  const handleEditVenueType = (venueType: VenueType) => {
    setEditingVenueType(venueType);
    venueTypeForm.reset({
      name: venueType.name || '',
      code: venueType.code || '',
    });
    setError('');
    setSuccess('');
    setIsVenueTypeModalOpen(true);
  };

  // Handle Venue Type form submit
  const onVenueTypeSubmit = async (data: VenueTypeFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.code) {
        formData.append('code', data.code);
      }

      if (editingVenueType) {
        formData.append('id', editingVenueType.id.toString());
      }

      const result = editingVenueType
        ? await updateVenueType(formData)
        : await createVenueType(formData);

      if (result.ok) {
        setSuccess(editingVenueType ? 'Venue type updated successfully' : 'Venue type created successfully');
        setIsVenueTypeModalOpen(false);
        venueTypeForm.reset();
        await refreshVenueTypes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save venue type');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete Venue Type
  const handleDeleteVenueType = async (venueType: VenueType) => {
    setDeleteVenueTypeDialog(venueType);
  };

  const confirmDeleteVenueType = async () => {
    if (!deleteVenueTypeDialog) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('id', deleteVenueTypeDialog.id.toString());
      const result = await deleteVenueType(formData);

      if (result.ok) {
        setSuccess('Venue type deleted successfully');
        setDeleteVenueTypeDialog(null);
        await refreshVenueTypes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to delete venue type');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
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
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Venue Type Management Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Venue Types</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage venue types used in entries
            </p>
          </div>
          <Button onClick={handleCreateVenueType}>
            Add Venue Type
          </Button>
        </div>

        {/* Venue Types Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venueTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No venue types found. Click &quot;Add Venue Type&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              venueTypes.map((venueType) => (
                <TableRow key={venueType.id}>
                  <TableCell className="font-medium">{venueType.name}</TableCell>
                  <TableCell className="text-muted-foreground">{venueType.code}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(venueType.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <ButtonGroup className="justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditVenueType(venueType)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label="Edit Venue Type"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteVenueType(venueType)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="Delete Venue Type"
                      >
                        <Trash2 />
                      </Button>
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* Venue Type Create/Edit Modal */}
      <Dialog open={isVenueTypeModalOpen} onOpenChange={(open) => !isLoading && setIsVenueTypeModalOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVenueType ? 'Edit Venue Type' : 'Add Venue Type'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={venueTypeForm.handleSubmit(onVenueTypeSubmit)}>
            <div className="space-y-4 py-4">
              <Controller
                name="name"
                control={venueTypeForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name *</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g., Events Hall"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="code"
                control={venueTypeForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Code</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g., events-hall (auto-generated from name)"
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
                        field.onChange(value);
                      }}
                    />
                    <FieldDescription>
                      Code is auto-generated from name if not provided. Used internally for references.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVenueTypeModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingVenueType ? 'Update Venue Type' : 'Create Venue Type'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Venue Type Confirmation Dialog */}
      <AlertDialog open={!!deleteVenueTypeDialog} onOpenChange={(open) => !open && setDeleteVenueTypeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteVenueTypeDialog?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVenueType}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
