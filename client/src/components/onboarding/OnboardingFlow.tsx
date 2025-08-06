import { useState, useEffect } from 'react';
import { useOnboarding, useTutorial } from '@/hooks/useOnboarding';
import { useTutorialContext } from '@/contexts/TutorialContext';
import OnboardingModal from './OnboardingModal';
import TutorialProposalModal from '../tutorial/TutorialProposalModal';
import TutorialLightbulb from '../tutorial/TutorialLightbulb';

export default function OnboardingFlow() {
  const { userPreferences, isLoadingPreferences } = useOnboarding();
  const { startTour } = useTutorialContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTutorialProposal, setShowTutorialProposal] = useState(false);
  const [showLightbulb, setShowLightbulb] = useState(false);
  const [lightbulbHighlighted, setLightbulbHighlighted] = useState(false);

  // Vérifier si l'onboarding doit être affiché
  useEffect(() => {
    if (!isLoadingPreferences && userPreferences) {
      // Si l'onboarding n'est pas complété, l'afficher
      if (!userPreferences.onboardingCompleted) {
        setShowOnboarding(true);
      } else {
        // Si onboarding complété, fermer le modal d'onboarding
        setShowOnboarding(false);
      }
    }
  }, [userPreferences, isLoadingPreferences]);

  // Quand l'onboarding est terminé
  const handleOnboardingComplete = () => {
    // Forcer immédiatement la fermeture du modal
    setShowOnboarding(false);
    
    // Recharger la page après un court délai pour rafraîchir l'état complet
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Quand l'utilisateur accepte le tutoriel
  const handleTutorialAccept = () => {
    setShowTutorialProposal(false);
    // Marquer la proposition comme vue et acceptée
    // Lancer le tutoriel général
    startTour('general');
  };

  // Quand l'utilisateur refuse le tutoriel
  const handleTutorialDecline = () => {
    setShowTutorialProposal(false);
    // Marquer la proposition comme vue mais refusée
    // Afficher l'ampoule avec highlight
    setShowLightbulb(true);
    setLightbulbHighlighted(true);
  };

  // Quand l'utilisateur clique sur l'ampoule
  const handleLightbulbClick = () => {
    setShowTutorialProposal(true);
    setLightbulbHighlighted(false);
  };

  // Quand l'utilisateur ferme le tooltip de l'ampoule
  const handleLightbulbDismiss = () => {
    setLightbulbHighlighted(false);
  };

  return (
    <>
      {/* Modal d'onboarding obligatoire */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {}} // Fonction vide car non fermable
        onComplete={handleOnboardingComplete}
      />

      {/* Modal de proposition de tutoriel - DÉSACTIVÉ */}
      {/* L'utilisateur peut accéder aux tutoriels via l'icône "Aide" dans la sidebar */}

      {/* Bouton ampoule pour relancer le tutoriel - DÉSACTIVÉ */}
      {/* L'icône tutorial est maintenant intégrée discrètement dans le header */}
      {/* 
      <TutorialLightbulb
        isVisible={showLightbulb && !showTutorialProposal}
        onClick={handleLightbulbClick}
        onDismiss={handleLightbulbDismiss}
        showHighlight={lightbulbHighlighted}
      />
      */}
    </>
  );
}