import React, { createContext, useContext, useState, useEffect } from 'react';
import { TutorialState, TutorialTour, TUTORIAL_TOURS } from '@/types/tutorial';
import { allTours } from '@/data/tours';
import { useTutorial } from '@/hooks/useOnboarding';
import CustomTutorial from '@/components/tutorial/CustomTutorial';

interface TutorialContextType {
  startTour: (tourId: string) => void;
  stopTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  isRunning: boolean;
  currentTour: string | null;
  tutorialState: TutorialState;
  canShowTutorials: boolean;
  resetTutorialPreferences: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

interface TutorialProviderProps {
  children: React.ReactNode;
}

const tutorialStyles = {
  options: {
    primaryColor: '#3B82F6',
    textColor: '#374151',
    backgroundColor: '#FFFFFF',
    overlayColor: 'rgba(0, 0, 0, 0.75)',
    spotlightShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
    beaconSize: 36,
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 12,
    fontSize: 14,
    padding: 20,
    textAlign: 'left' as const,
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
  },
  buttonNext: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 16px',
    border: 'none',
    cursor: 'pointer',
  },
  buttonBack: {
    backgroundColor: 'transparent',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 16px',
    marginRight: 8,
    cursor: 'pointer',
  },
  buttonSkip: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9CA3AF',
    fontSize: 12,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  spotlight: {
    borderRadius: 8,
  },
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const { tutorialProgress, saveTutorialProgress, userPreferences, saveUserPreferences } = useTutorial();
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    currentTour: null,
    stepIndex: 0,
    isRunning: false,
    completedTours: [],
    skippedTours: [],
  });
  
  // Gérer les préférences de tutoriel
  const [canShowTutorials, setCanShowTutorials] = useState(true);

  // Charger la progression depuis l'API
  useEffect(() => {
    if (tutorialProgress) {
      const completedTours = Object.keys(tutorialProgress).filter(
        key => tutorialProgress[key]?.completed
      );
      const skippedTours = Object.keys(tutorialProgress).filter(
        key => tutorialProgress[key]?.skipped
      );

      setTutorialState(prev => {
        // Éviter la mise à jour si rien n'a changé
        if (
          prev.completedTours.length === completedTours.length &&
          prev.skippedTours.length === skippedTours.length &&
          prev.completedTours.every(tour => completedTours.includes(tour)) &&
          prev.skippedTours.every(tour => skippedTours.includes(tour))
        ) {
          return prev;
        }

        return {
          ...prev,
          completedTours,
          skippedTours,
        };
      });
    }
  }, [tutorialProgress]);

  // Charger les préférences de tutoriel
  useEffect(() => {
    if (userPreferences?.tutorialPreferences) {
      const prefs = userPreferences.tutorialPreferences as any;
      // Toujours permettre les tutoriels - ils ne sont plus bloqués définitivement
      setCanShowTutorials(true);
    }
  }, [userPreferences]);

  const startTour = (tourId: string) => {
    if (!allTours[tourId as keyof typeof allTours]) {
      console.error(`Tour ${tourId} not found`);
      return;
    }

    // Toujours permettre de lancer un tutoriel manuellement via l'aide
    setTutorialState(prev => ({
      ...prev,
      currentTour: tourId,
      stepIndex: 0,
      isRunning: true,
    }));
  };

  const stopTour = () => {
    setTutorialState(prev => ({
      ...prev,
      currentTour: null,
      stepIndex: 0,
      isRunning: false,
    }));
  };

  const skipTour = () => {
    if (tutorialState.currentTour) {
      // Sauvegarder que le tour a été skippé
      saveTutorialProgress.mutate({
        tutorialStep: tutorialState.currentTour,
        completed: false,
        progress: { skipped: true, skippedAt: new Date() }
      });

      // Si c'est la première fois qu'un tutorial est skippé, 
      // supprimer la clé localStorage pour déclencher le highlight de l'aide
      const hasSeenTutorialIcon = localStorage.getItem('velocitaleads-tutorial-seen');
      if (hasSeenTutorialIcon) {
        localStorage.removeItem('velocitaleads-tutorial-seen');
      }

      setTutorialState(prev => ({
        ...prev,
        skippedTours: [...prev.skippedTours, tutorialState.currentTour!],
        currentTour: null,
        stepIndex: 0,
        isRunning: false,
      }));
    }
  };


  const resetTutorialPreferences = () => {
    // Réactiver les tutoriels
    const newPreferences = {
      showTutorials: true,
      skippedAll: false,
      resetAt: new Date().toISOString()
    };

    if (saveUserPreferences) {
      saveUserPreferences.mutate({
        tutorialPreferences: newPreferences
      });
    }

    setCanShowTutorials(true);
  };

  const nextStep = () => {
    setTutorialState(prev => ({
      ...prev,
      stepIndex: prev.stepIndex + 1,
    }));
  };

  const prevStep = () => {
    setTutorialState(prev => ({
      ...prev,
      stepIndex: Math.max(0, prev.stepIndex - 1),
    }));
  };

  const handleTutorialComplete = () => {
    if (tutorialState.currentTour) {
      // Sauvegarder la progression comme complétée
      saveTutorialProgress.mutate({
        tutorialStep: tutorialState.currentTour,
        completed: true,
        progress: { 
          completed: true,
          completedAt: new Date(),
          totalSteps: getCurrentTour()?.steps.length || 0,
          finalStep: getCurrentTour()?.steps.length || 0
        }
      });

      setTutorialState(prev => ({
        ...prev,
        completedTours: [...prev.completedTours, tutorialState.currentTour!],
        currentTour: null,
        stepIndex: 0,
        isRunning: false,
      }));
    }
  };

  const handleTutorialSkip = () => {
    if (tutorialState.currentTour) {
      // Sauvegarder la progression comme skippée
      saveTutorialProgress.mutate({
        tutorialStep: tutorialState.currentTour,
        completed: false,
        progress: { 
          skipped: true,
          skippedAt: new Date(),
          totalSteps: getCurrentTour()?.steps.length || 0,
          finalStep: tutorialState.stepIndex
        }
      });

      // Déclencher le highlight de l'aide
      localStorage.removeItem('velocitaleads-tutorial-seen');

      setTutorialState(prev => ({
        ...prev,
        skippedTours: [...prev.skippedTours, tutorialState.currentTour!],
        currentTour: null,
        stepIndex: 0,
        isRunning: false,
      }));
    }
  };

  const getCurrentTour = (): TutorialTour | null => {
    if (!tutorialState.currentTour) return null;
    return allTours[tutorialState.currentTour as keyof typeof allTours] || null;
  };

  const currentTour = getCurrentTour();

  return (
    <TutorialContext.Provider
      value={{
        startTour,
        stopTour,
        skipTour,
        nextStep,
        prevStep,
        isRunning: tutorialState.isRunning,
        currentTour: tutorialState.currentTour,
        tutorialState,
        canShowTutorials,
        resetTutorialPreferences,
      }}
    >
      {children}
      

      {/* Tutorial custom avec tooltips pointés */}
      {tutorialState.isRunning && currentTour && (
        <CustomTutorial
          isOpen={tutorialState.isRunning}
          steps={currentTour.steps.map(step => ({
            target: step.target,
            content: step.content,
            placement: step.placement
          }))}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorialContext() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }
  return context;
}