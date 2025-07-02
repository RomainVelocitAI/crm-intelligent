import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { useTutorial } from './useOnboarding';

export function useTutorialAutoStart() {
  const location = useLocation();
  const { startTour, canShowTutorials, tutorialState } = useTutorialContext();
  const { userPreferences, isLoadingPreferences } = useTutorial();
  const [hasCheckedAutoStart, setHasCheckedAutoStart] = useState(false);

  useEffect(() => {
    // Attendre que les préférences soient chargées
    if (isLoadingPreferences || hasCheckedAutoStart) return;
    
    // Ne pas déclencher si les tutoriels sont désactivés
    if (!canShowTutorials) {
      setHasCheckedAutoStart(true);
      return;
    }

    // Ne pas déclencher si un tutoriel est déjà en cours
    if (tutorialState.isRunning) {
      setHasCheckedAutoStart(true);
      return;
    }

    const preferences = userPreferences?.tutorialPreferences as any;
    const completedTours = tutorialState.completedTours;
    const skippedTours = tutorialState.skippedTours;

    // Logique de déclenchement automatique basée sur la page et l'historique
    const autoStartLogic = () => {
      // Vérifier si c'est la toute première connexion de l'utilisateur
      const hasEverStartedTutorial = localStorage.getItem('velocitaleads-tutorial-ever-started');
      const hasCompletedOnboarding = userPreferences?.onboardingCompleted;
      
      // Déclencher le tutorial automatiquement SEULEMENT à la toute première connexion
      // après l'onboarding et si aucun tutorial n'a jamais été démarré
      if (hasCompletedOnboarding && 
          !hasEverStartedTutorial &&
          !completedTours.includes('general') && 
          !skippedTours.includes('general')) {
        
        // Marquer qu'un tutorial a été démarré automatiquement
        localStorage.setItem('velocitaleads-tutorial-ever-started', 'true');
        
        // Déclencher le tour général après l'onboarding
        setTimeout(() => {
          startTour('general');
        }, 2000);
        return;
      }
    };

    // Déclencher la logique
    autoStartLogic();
    setHasCheckedAutoStart(true);

  }, [
    location.pathname, 
    canShowTutorials, 
    tutorialState.isRunning,
    tutorialState.completedTours,
    tutorialState.skippedTours,
    userPreferences,
    isLoadingPreferences,
    hasCheckedAutoStart,
    startTour
  ]);

  // Réinitialiser le check quand la page change
  useEffect(() => {
    setHasCheckedAutoStart(false);
  }, [location.pathname]);

  return {
    hasCheckedAutoStart
  };
}