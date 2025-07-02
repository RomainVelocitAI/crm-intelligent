import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/Layout.tsx';
import LoginPage from '@/pages/Login';
import ContactsPage from '@/pages/Contacts';
import QuotesPage from '@/pages/Quotes';
import MetricsPage from '@/pages/Metrics';
import ArchivesPage from '@/pages/Archives';
import { useEffect, useState } from 'react';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import TutorialButton from '@/components/TutorialButton';

// Component pour gérer l'onboarding une fois connecté
function AuthenticatedApp() {
  const { userPreferences, isLoadingPreferences } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoadingPreferences && userPreferences) {
      // Si l'utilisateur n'a pas complété l'onboarding, l'afficher
      if (!userPreferences.onboardingCompleted) {
        setShowOnboarding(true);
      }
    }
  }, [userPreferences, isLoadingPreferences]);

  if (isLoadingPreferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <TutorialProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/contacts" replace />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/opportunites" element={<QuotesPage />} />
          <Route path="/metriques" element={<MetricsPage />} />
          <Route path="/archives" element={<ArchivesPage />} />
          <Route path="*" element={<Navigate to="/contacts" replace />} />
        </Routes>
        
        {/* Tutorial Button - DÉSACTIVÉ car maintenant intégré dans le header */}
        {/* <TutorialButton /> */}
        
        {/* Onboarding Modal */}
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
          />
        )}
      </Layout>
    </TutorialProvider>
  );
}

function App() {
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier le token au démarrage
  useEffect(() => {
    const savedAuth = localStorage.getItem('velocitaleads-auth');
    console.log('Saved auth on startup:', savedAuth);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedApp />;
}

export default App;