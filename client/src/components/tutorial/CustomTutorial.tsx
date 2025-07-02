import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';

interface TutorialStep {
  target: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface CustomTutorialProps {
  isOpen: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function CustomTutorial({ isOpen, steps, onComplete, onSkip }: CustomTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom' | 'left' | 'right' | 'center'>('center');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!isOpen || currentStep >= steps.length) return;

    const currentStepData = steps[currentStep];
    const targetElement = document.querySelector(currentStepData.target);
    
    if (!targetElement || !tooltipRef.current) {
      // Si l'élément n'existe pas, centrer
      setTooltipPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200
      });
      setTooltipPlacement('center');
      return;
    }

    // Scroll automatique vers l'élément ciblé
    const elementRect = targetElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Vérifier si l'élément est suffisamment visible (au moins 80% dans la viewport)
    const isElementVisible = (
      elementRect.top >= -elementRect.height * 0.2 &&
      elementRect.left >= -elementRect.width * 0.2 &&
      elementRect.bottom <= viewportHeight + elementRect.height * 0.2 &&
      elementRect.right <= viewportWidth + elementRect.width * 0.2 &&
      elementRect.top < viewportHeight - 100 && // Laisser de l'espace pour le tooltip
      elementRect.bottom > 100 // Laisser de l'espace en haut
    );

    if (!isElementVisible) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
      
      // Attendre que le scroll soit terminé avant de calculer la position
      setTimeout(() => {
        calculatePositionAfterScroll();
      }, 500);
      return;
    }

    calculatePositionAfterScroll();
  };

  const calculatePositionAfterScroll = () => {
    const currentStepData = steps[currentStep];
    const targetElement = document.querySelector(currentStepData.target);
    
    if (!targetElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const placement = currentStepData.placement || 'bottom';
    
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 10;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 10;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 10;
        break;
      case 'center':
      default:
        top = window.innerHeight / 2 - tooltipRect.height / 2;
        left = window.innerWidth / 2 - tooltipRect.width / 2;
        break;
    }

    // Ajustements pour rester dans la fenêtre
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    setTooltipPosition({ top, left });
    setTooltipPlacement(placement);
  };

  useEffect(() => {
    if (isOpen) {
      // Délai pour laisser le temps au DOM de se mettre à jour et au scroll de se terminer
      const timer = setTimeout(calculatePosition, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const targetElement = document.querySelector(currentStepData.target);

  return (
    <>
      {/* Overlay avec découpe transparente autour de l'élément ciblé */}
      {targetElement && tooltipPlacement !== 'center' ? (
        <>
          {(() => {
            const rect = targetElement.getBoundingClientRect();
            const padding = 8;
            
            return (
              <>
                {/* Overlay top */}
                <div 
                  className="fixed bg-black bg-opacity-50 z-50" 
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    height: rect.top - padding,
                    pointerEvents: 'none'
                  }}
                />
                
                {/* Overlay bottom */}
                <div 
                  className="fixed bg-black bg-opacity-50 z-50" 
                  style={{
                    top: rect.bottom + padding,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none'
                  }}
                />
                
                {/* Overlay left */}
                <div 
                  className="fixed bg-black bg-opacity-50 z-50" 
                  style={{
                    top: rect.top - padding,
                    left: 0,
                    width: rect.left - padding,
                    height: rect.height + (padding * 2),
                    pointerEvents: 'none'
                  }}
                />
                
                {/* Overlay right */}
                <div 
                  className="fixed bg-black bg-opacity-50 z-50" 
                  style={{
                    top: rect.top - padding,
                    left: rect.right + padding,
                    right: 0,
                    height: rect.height + (padding * 2),
                    pointerEvents: 'none'
                  }}
                />
              </>
            );
          })()}
        </>
      ) : (
        /* Overlay classique pour les éléments centrés */
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" style={{ pointerEvents: 'none' }} />
      )}
      
      {/* Tooltip positionné */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white rounded-lg shadow-2xl border max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Flèche de pointage */}
        {tooltipPlacement !== 'center' && (
          <div
            className={`absolute w-3 h-3 bg-white border transform rotate-45 ${
              tooltipPlacement === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
              tooltipPlacement === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
              tooltipPlacement === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
              'left-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
            }`}
          />
        )}

        {/* Header compact */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">
                Étape {currentStep + 1} sur {steps.length}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <div 
            className="text-gray-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentStepData.content }}
          />
        </div>

        {/* Footer avec navigation */}
        <div className="p-4 pt-0 flex items-center justify-between">
          {/* Indicateur de progression */}
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Boutons de navigation */}
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Précédent</span>
              </button>
            )}

            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 text-xs px-1"
            >
              Passer
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-1 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              <span>
                {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
              </span>
              {currentStep === steps.length - 1 ? (
                <SkipForward className="w-3 h-3" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}