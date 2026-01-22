"use client";

import { useState } from 'react';
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
import { createPOC, updatePOC, deletePOC, getAllPOCs } from './actions';
import type { PointOfContact } from '../../../types/supabase';

type POCProps = {
  initialPOCs?: PointOfContact[];
}

// Zod schema
const pocSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  role: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.union([
    z.string().email("Adresse e-mail invalide"),
    z.literal(""),
  ]).optional(),
});

type POCFormData = z.infer<typeof pocSchema>;

export default function POCManagement({ initialPOCs = [] }: POCProps) {
  const [pocs, setPocs] = useState<PointOfContact[]>(initialPOCs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // POC form state
  const [isPOCModalOpen, setIsPOCModalOpen] = useState(false);
  const [editingPOC, setEditingPOC] = useState<PointOfContact | null>(null);
  const pocForm = useForm<POCFormData>({
    resolver: zodResolver(pocSchema),
    defaultValues: {
      name: '',
      role: '',
      phoneNumber: '',
      email: '',
    },
  });

  // Delete confirmation dialog
  const [deletePOCDialog, setDeletePOCDialog] = useState<PointOfContact | null>(null);

  // Refresh POCs list
  const refreshPOCs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getAllPOCs();
      if (result.ok) {
        setPocs(result.data || []);
      } else {
        setError(result.error || 'Échec du chargement des points de contact');
      }
      } catch {
        setError('Échec du chargement des points de contact');
      } finally {
      setIsLoading(false);
    }
  };

  // Open create POC modal
  const handleCreatePOC = () => {
    setEditingPOC(null);
    pocForm.reset({
      name: '',
      role: '',
      phoneNumber: '',
      email: '',
    });
    setError('');
    setSuccess('');
    setIsPOCModalOpen(true);
  };

  // Open edit POC modal
  const handleEditPOC = (poc: PointOfContact) => {
    setEditingPOC(poc);
    pocForm.reset({
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
  const onPOCSubmit = async (data: POCFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.role) formData.append('role', data.role);
      if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
      if (data.email) formData.append('email', data.email);

      if (editingPOC) {
        formData.append('id', editingPOC.id.toString());
      }

      const result = editingPOC
        ? await updatePOC(formData)
        : await createPOC(formData);

      if (result.ok) {
        setSuccess(editingPOC ? 'Point de contact mis à jour avec succès' : 'Point de contact créé avec succès');
        setIsPOCModalOpen(false);
        pocForm.reset();
        await refreshPOCs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Échec de l\'enregistrement du point de contact');
      }
    } catch {
      setError('Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete POC
  const handleDeletePOC = async (poc: PointOfContact) => {
    setDeletePOCDialog(poc);
  };

  const confirmDeletePOC = async () => {
    if (!deletePOCDialog) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('id', deletePOCDialog.id.toString());
      const result = await deletePOC(formData);

      if (result.ok) {
        setSuccess('Point de contact supprimé avec succès');
        setDeletePOCDialog(null);
        await refreshPOCs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Échec de la suppression du point de contact');
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

      {/* POC Management Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Points de contact</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez les points de contact utilisés dans les entrées
            </p>
          </div>
          <Button onClick={handleCreatePOC}>
            Ajouter un point de contact
          </Button>
        </div>

        {/* POCs Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Créé</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun point de contact trouvé. Cliquez sur &quot;Ajouter un point de contact&quot; pour en créer un.
                </TableCell>
              </TableRow>
            ) : (
              pocs.map((poc) => (
                <TableRow key={poc.id}>
                  <TableCell className="font-medium">{poc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{poc.role || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{poc.phoneNumber || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{poc.email || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(poc.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <ButtonGroup className="justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPOC(poc)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label="Modifier le point de contact"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePOC(poc)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="Supprimer le point de contact"
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

      {/* POC Create/Edit Modal */}
      <Dialog open={isPOCModalOpen} onOpenChange={(open) => !isLoading && setIsPOCModalOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPOC ? 'Modifier le point de contact' : 'Ajouter un point de contact'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={pocForm.handleSubmit(onPOCSubmit)}>
            <div className="space-y-4 py-4">
              <Controller
                name="name"
                control={pocForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Nom *</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="ex. Jean Dupont"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="role"
                control={pocForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Rôle</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="ex. Coordinateur d'événements"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phoneNumber"
                control={pocForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Numéro de téléphone</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="tel"
                      aria-invalid={fieldState.invalid}
                      placeholder="ex. +32 123 456 789"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={pocForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="ex. jean@exemple.com"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPOCModalOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : editingPOC ? 'Mettre à jour le point de contact' : 'Créer le point de contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete POC Confirmation Dialog */}
      <AlertDialog open={!!deletePOCDialog} onOpenChange={(open) => !open && setDeletePOCDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le point de contact</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deletePOCDialog?.name}&quot; ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePOC}
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
