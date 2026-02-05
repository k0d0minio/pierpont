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
  name: z.string().min(1, "Le nom est requis"),
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
        setError(result.error || 'Échec du chargement des types de lieu');
      }
      } catch {
        setError('Échec du chargement des types de lieu');
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
        setSuccess(editingVenueType ? 'Type de lieu mis à jour avec succès' : 'Type de lieu créé avec succès');
        setIsVenueTypeModalOpen(false);
        venueTypeForm.reset();
        await refreshVenueTypes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Échec de l\'enregistrement du type de lieu');
      }
    } catch {
      setError('Une erreur s\'est produite. Veuillez réessayer.');
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
        setSuccess('Type de lieu supprimé avec succès');
        setDeleteVenueTypeDialog(null);
        await refreshVenueTypes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Échec de la suppression du type de lieu');
      }
    } catch {
      setError('Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/D';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
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
            <h2 className="text-xl font-semibold">Types de lieu</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez les types de lieu utilisés dans les entrées
            </p>
          </div>
          <Button onClick={handleCreateVenueType}>
            Ajouter un type de lieu
          </Button>
        </div>

        {/* Venue Types Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Créé</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venueTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Aucun type de lieu trouvé. Cliquez sur &quot;Ajouter un type de lieu&quot; pour en créer un.
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
                        aria-label="Modifier le type de lieu"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteVenueType(venueType)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="Supprimer le type de lieu"
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
            <DialogTitle>{editingVenueType ? 'Modifier le type de lieu' : 'Ajouter un type de lieu'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={venueTypeForm.handleSubmit(onVenueTypeSubmit)}>
            <div className="space-y-4 py-4">
              <Controller
                name="name"
                control={venueTypeForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Nom *</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="ex. Salle des événements"
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
                      placeholder="ex. salle-evenements (généré automatiquement à partir du nom)"
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
                        field.onChange(value);
                      }}
                    />
                    <FieldDescription>
                      {"Le code est généré automatiquement à partir du nom s'il n'est pas fourni. Utilisé en interne pour les références."}
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
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : editingVenueType ? 'Mettre à jour le type de lieu' : 'Créer le type de lieu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Venue Type Confirmation Dialog */}
      <AlertDialog open={!!deleteVenueTypeDialog} onOpenChange={(open) => !open && setDeleteVenueTypeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le type de lieu</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deleteVenueTypeDialog?.name}&quot; ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVenueType}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
