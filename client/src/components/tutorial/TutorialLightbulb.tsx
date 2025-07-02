import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';

interface TutorialLightbulbProps {
  isVisible: boolean;
  onClick: () => void;
  onDismiss?: () => void;
  showHighlight?: boolean;
}

export default function TutorialLightbulb({ 
  isVisible, 
  onClick, 
  onDismiss,
  showHighlight = false 
}: TutorialLightbulbProps) {
  const [shouldPulse, setShouldPulse] = useState(showHighlight);
  const [showTooltip, setShowTooltip] = useState(showHighlight);

  useEffect(() => {
    if (showHighlight) {
      setShouldPulse(true);
      setShowTooltip(true);
      
      // Arrêter l'animation après 10 secondes
      const timer = setTimeout(() => {
        setShouldPulse(false);
        setShowTooltip(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showHighlight]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay de highlight si nécessaire */}
      {showHighlight && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />
      )}
      
      {/* Bouton ampoule */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative">
          {/* Tooltip explicatif */}
          {showTooltip && (
            <div className="absolute bottom-16 left-0 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 whitespace-nowrap shadow-xl min-w-max">
              <div className="flex items-center justify-between space-x-2">
                <span>Cliquez ici pour voir le tutoriel</span>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="text-gray-300 hover:text-white ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Flèche pointant vers le bouton */}
              <div className="absolute top-full left-4">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}

          {/* Bouton principal */}
          <button
            onClick={onClick}
            className={`
              relative group flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 
              bg-amber-500 hover:bg-amber-600 text-white
              ${shouldPulse ? 'animate-bounce' : ''}
            `}
            title="Lancer le tutoriel interactif"
          >
            {/* Animation de pulsation pour attirer l'attention */}
            {shouldPulse && (
              <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75"></div>
            )}
            
            <Lightbulb className="w-7 h-7 relative z-10" />
            
            {/* Effet de brillance */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white opacity-20"></div>
          </button>

          {/* Badge "Nouveau" si c'est la première fois */}
          {showHighlight && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              !
            </div>
          )}
        </div>
      </div>
    </>
  );
}