import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { createAnnouncement } from '../utils/api';

interface AnnouncementFormData {
  title: string;
  content: string;
  type: string;
}

const CreateAnnouncementForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementFormData>();

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      setIsLoading(true);
      await createAnnouncement(data);
      toast.success('Annonce créée avec succès !');
      reset();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'annonce');
      console.error('Error creating announcement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Créer une nouvelle annonce</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre
          </label>
          <input
            type="text"
            {...register('title', { 
              required: 'Le titre est requis',
              minLength: { value: 1, message: 'Le titre est trop court' },
              maxLength: { value: 200, message: 'Le titre est trop long' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Contenu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenu
          </label>
          <textarea
            {...register('content', { 
              required: 'Le contenu est requis',
              minLength: { value: 1, message: 'Le contenu est trop court' }
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            {...register('type', { required: 'Le type est requis' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="info">Information</option>
            <option value="alert">Alerte</option>
            <option value="event">Événement</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Création en cours...' : 'Créer l\'annonce'}
        </button>
      </form>
    </div>
  );
};

export default CreateAnnouncementForm; 