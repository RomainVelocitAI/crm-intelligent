import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Contact, ContactStatus } from '@/types';

const contactSchema = z.object({
  prenom: z.string().min(1, 'Le prenom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  entreprise: z.string().optional(),
  poste: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  statut: z.nativeEnum(ContactStatus),
  notes: z.string().optional(),
});

const statusLabels = {
  [ContactStatus.CLIENT_ACTIF]: 'Client actif',
  [ContactStatus.PROSPECT_CHAUD]: 'Prospect chaud',
  [ContactStatus.PROSPECT_TIEDE]: 'Prospect tiede',
  [ContactStatus.PROSPECT_FROID]: 'Prospect froid',
  [ContactStatus.INACTIF]: 'Inactif',
};

interface ContactFormProps {
  contact: Contact | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: contact ? {
      prenom: contact.prenom,
      nom: contact.nom,
      email: contact.email,
      telephone: contact.telephone || '',
      entreprise: contact.entreprise || '',
      poste: contact.poste || '',
      adresse: contact.adresse || '',
      codePostal: contact.codePostal || '',
      ville: contact.ville || '',
      pays: contact.pays || 'France',
      statut: contact.statut,
      notes: contact.notes || '',
    } : {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      entreprise: '',
      poste: '',
      adresse: '',
      codePostal: '',
      ville: '',
      pays: 'France',
      statut: ContactStatus.PROSPECT_FROID,
      notes: '',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prenom *
          </label>
          <input
            {...register('prenom')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.prenom && (
            <p className="text-red-500 text-sm mt-1">{errors.prenom.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            {...register('nom')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.nom && (
            <p className="text-red-500 text-sm mt-1">{errors.nom.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telephone
          </label>
          <input
            {...register('telephone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entreprise
          </label>
          <input
            {...register('entreprise')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Poste
        </label>
        <input
          {...register('poste')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Statut
        </label>
        <select
          {...register('statut')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(statusLabels).map(([status, label]) => (
            <option key={status} value={status}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sauvegarde...' : (contact ? 'Modifier' : 'Creer')}
        </button>
      </div>
    </form>
  );
}