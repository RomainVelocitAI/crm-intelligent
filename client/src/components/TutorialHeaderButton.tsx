import { useState, useEffect } from 'react';
import { Lightbulb, Settings, Play, X, HelpCircle } from 'lucide-react';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TutorialHeaderButton() {
  const { canShowTutorials, startTour, isRunning } = useTutorialContext();
  const [showMenu, setShowMenu] = useState(false);
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Vérifier si c'est la première fois qu'on voit l'icône
  useEffect(() => {
    const hasSeenTutorialIcon = localStorage.getItem('velocitaleads-tutorial-seen');
    if (!hasSeenTutorialIcon && canShowTutorials) {
      setShouldHighlight(true);
    }
  }, [canShowTutorials]);

  // Marquer comme vu quand l'utilisateur interagit avec
  const handleIconClick = () => {
    if (shouldHighlight) {
      localStorage.setItem('velocitaleads-tutorial-seen', 'true');
      setShouldHighlight(false);
    }
    setShowMenu(!showMenu);
  };

  // Arrêter le highlight après 15 secondes
  useEffect(() => {
    if (shouldHighlight) {
      const timer = setTimeout(() => {
        setShouldHighlight(false);
        localStorage.setItem('velocitaleads-tutorial-seen', 'true');
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [shouldHighlight]);

  const quickTours = [
    { id: 'general', name: 'Visite générale', icon: '🏠', description: 'Découvrir l\'interface' },
    { id: 'contacts', name: 'Contacts', icon: '👥', description: 'Gestion des contacts' },
    { id: 'quotes', name: 'Devis', icon: '📄', description: 'Créer et envoyer des devis' },
    { id: 'metrics', name: 'Métriques', icon: '📊', description: 'Analyser les performances' },
  ];

  const handleTourStart = (tourId: string) => {
    // Mapping des tours vers les pages correspondantes
    const tourToPage = {
      'general': '/contacts', // Tour général commence sur contacts
      'contacts': '/contacts',
      'quotes': '/opportunites',
      'metrics': '/metriques'
    };
    
    const targetPage = tourToPage[tourId as keyof typeof tourToPage];
    
    // Si on n'est pas sur la bonne page, naviguer d'abord
    if (targetPage && location.pathname !== targetPage) {
      navigate(targetPage);
      // Démarrer le tour après un délai pour laisser la page se charger
      setTimeout(() => {
        startTour(tourId);
      }, 300);
    } else {
      // On est déjà sur la bonne page, démarrer immédiatement
      startTour(tourId);
    }
    
    setShowMenu(false);
  };

  // Ne pas afficher si un tutoriel est en cours
  if (isRunning) return null;

  return (
    <div className="relative">
      {/* Bouton principal - adapté à la sidebar */}
      <button
        onClick={handleIconClick}
        className={`
          relative w-full flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium transition-all duration-200
          ${shouldHighlight 
            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 animate-pulse' 
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }
          ${showMenu ? 'bg-gray-100 text-gray-600' : ''}
        `}
        title={shouldHighlight ? 'Nouveau ! Découvrez les tutoriels' : 'Aide et tutoriels'}
      >
        {/* Animation de brillance pour la première fois */}
        {shouldHighlight && (
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-amber-200 to-yellow-200 opacity-30 animate-ping"></div>
        )}
        
        <Lightbulb 
          className={`w-4 h-4 mr-1 relative z-10 ${shouldHighlight ? 'drop-shadow-sm' : ''}`} 
        />
        <span className="relative z-10">Aide</span>
        
        {/* Badge "Nouveau" discret */}
        {shouldHighlight && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-bounce">
            <div className="absolute inset-0 w-3 h-3 bg-amber-400 rounded-full animate-ping"></div>
          </div>
        )}
      </button>

      {/* Menu déroulant - adapté à la sidebar */}
      {showMenu && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tutoriels</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Découvrez les fonctionnalités de VelocitaLeads</p>
          </div>
          
          <div className="p-2">
            {quickTours.map((tour) => (
              <button
                key={tour.id}
                onClick={() => handleTourStart(tour.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-blue-50 flex items-center space-x-3 transition-colors group"
              >
                <span className="text-xl flex-shrink-0">{tour.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-blue-700">
                    {tour.name}
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-blue-600">
                    {tour.description}
                  </div>
                </div>
                <Play className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              💡 Vous pouvez relancer un tutoriel à tout moment
            </p>
          </div>
        </div>
      )}

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