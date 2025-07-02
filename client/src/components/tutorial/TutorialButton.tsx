import { useState } from 'react';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { HelpCircle, Settings, Play, X } from 'lucide-react';
import TutorialSettings from './TutorialSettings';

export default function TutorialButton() {
  const { canShowTutorials, startTour, isRunning } = useTutorialContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const quickTours = [
    { id: 'general', name: 'Visite générale', icon: '🏠' },
    { id: 'contacts', name: 'Contacts', icon: '👥' },
    { id: 'quotes', name: 'Devis', icon: '📄' },
    { id: 'metrics', name: 'Métriques', icon: '📊' },
  ];

  const handleTourStart = (tourId: string) => {
    startTour(tourId);
    setShowQuickMenu(false);
  };

  // Ne pas afficher le bouton si un tutoriel est en cours
  if (isRunning) return null;

  return (
    <>
      {/* Bouton principal */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Menu rapide */}
          {showQuickMenu && (
            <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">
                Tours disponibles
              </div>
              {quickTours.map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => handleTourStart(tour.id)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                >
                  <span className="text-lg">{tour.icon}</span>
                  <span className="text-gray-700">{tour.name}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowSettings(true);
                    setShowQuickMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors text-gray-600"
                >
                  <Settings className="w-4 h-4" />
                  <span>Paramètres</span>
                </button>
              </div>
            </div>
          )}

          {/* Bouton principal */}
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className={`
              relative group flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 
              ${canShowTutorials 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
              }
              ${showQuickMenu ? 'ring-4 ring-blue-200' : ''}
            `}
            title={canShowTutorials ? 'Tutoriels disponibles' : 'Tutoriels (réactivation possible)'}
          >
            {showQuickMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
            
            {/* Badge pour indiquer l'état */}
            {!canShowTutorials && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">!</span>
              </div>
            )}
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-16 right-0 transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              {canShowTutorials ? 'Aide & Tutoriels' : 'Tutoriels désactivés'}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay pour fermer le menu */}
      {showQuickMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowQuickMenu(false)}
        />
      )}

      {/* Modal des paramètres */}
      <TutorialSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}