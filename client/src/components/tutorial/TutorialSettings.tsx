import { useState } from 'react';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { Play, RotateCcw, Settings, X } from 'lucide-react';

interface TutorialSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialSettings({ isOpen, onClose }: TutorialSettingsProps) {
  const { 
    canShowTutorials, 
    resetTutorialPreferences, 
    tutorialState,
    startTour 
  } = useTutorialContext();

  const [isResetting, setIsResetting] = useState(false);

  const handleResetPreferences = async () => {
    setIsResetting(true);
    try {
      await resetTutorialPreferences();
      // Small delay for user feedback
      setTimeout(() => {
        setIsResetting(false);
      }, 1000);
    } catch (error) {
      setIsResetting(false);
    }
  };

  const availableTours = [
    { id: 'general', name: 'Visite générale', description: 'Vue d\'ensemble de VelocitaLeads' },
    { id: 'contacts', name: 'Gestion des contacts', description: 'Créer et gérer vos contacts' },
    { id: 'quotes', name: 'Création de devis', description: 'Créer et envoyer des devis' },
    { id: 'metrics', name: 'Tableau de bord', description: 'Comprendre vos métriques' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6" />
              <h2 className="text-xl font-bold">Paramètres Tutoriel</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status actuel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">État actuel</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-green-700">
                Tutoriels disponibles
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Vous pouvez lancer n'importe quel tutoriel à tout moment.
            </p>
          </div>

          {/* Tours disponibles */}
          <div>
              <h4 className="font-semibold text-gray-900 mb-3">Tours disponibles</h4>
              <div className="space-y-2">
                {availableTours.map((tour) => {
                  const isCompleted = tutorialState.completedTours.includes(tour.id);
                  const isSkipped = tutorialState.skippedTours.includes(tour.id);
                  
                  return (
                    <div
                      key={tour.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-gray-900">{tour.name}</h5>
                          {isCompleted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Terminé
                            </span>
                          )}
                          {isSkipped && !isCompleted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              ⏭ Ignoré
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{tour.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          startTour(tour.id);
                          onClose();
                        }}
                        className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-sm"
                      >
                        <Play className="w-4 h-4" />
                        <span>Lancer</span>
                      </button>
                    </div>
                  );
                })}
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}