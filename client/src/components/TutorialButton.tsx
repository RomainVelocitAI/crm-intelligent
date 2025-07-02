import { useState } from 'react';
import { Play, BookOpen, CheckCircle, SkipForward } from 'lucide-react';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { allTours } from '@/data/tours';
import { useTutorial } from '@/hooks/useOnboarding';

export default function TutorialButton() {
  const [showMenu, setShowMenu] = useState(false);
  const { startTour, isRunning, currentTour } = useTutorialContext();
  const { tutorialProgress } = useTutorial();

  const tours = [
    { id: 'general', name: '🎯 Tour général', description: 'Interface principale' },
    { id: 'contacts', name: '👥 Contacts', description: 'Gestion des contacts' },
    { id: 'quotes', name: '📄 Devis', description: 'Création et suivi' },
    { id: 'metrics', name: '📊 Métriques', description: 'Analytics et KPIs' },
  ];

  const isTourCompleted = (tourId: string) => {
    return tutorialProgress[tourId]?.completed || false;
  };

  const handleTourStart = (tourId: string) => {
    startTour(tourId);
    setShowMenu(false);
  };

  if (isRunning) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">
              Tour {allTours[currentTour as keyof typeof allTours]?.name || 'en cours'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Menu déroulant */}
        {showMenu && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 mb-2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Tours guidés</h3>
              <p className="text-sm text-gray-600">Découvrez les fonctionnalités de VelocitaLeads</p>
            </div>
            
            <div className="space-y-3">
              {tours.map((tour) => {
                const isCompleted = isTourCompleted(tour.id);
                
                return (
                  <button
                    key={tour.id}
                    onClick={() => handleTourStart(tour.id)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{tour.name}</span>
                          {isCompleted && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{tour.description}</p>
                      </div>
                      <Play className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Vous pouvez relancer un tour à tout moment
              </p>
            </div>
          </div>
        )}

        {/* Bouton principal */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Tours guidés"
        >
          <BookOpen className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay pour fermer le menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}