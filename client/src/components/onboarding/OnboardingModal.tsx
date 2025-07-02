import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingFormData, BUSINESS_TYPES, SECTORS } from '@/types/onboarding';
import BusinessInfoStep from './BusinessInfoStep';
import TargetsStep from './TargetsStep';
import PreferencesStep from './PreferencesStep';
import FinalStep from './FinalStep';

const onboardingSchema = z.object({
  businessType: z.string().min(1, 'Type d\'entreprise requis'),
  sector: z.string().min(1, 'Secteur d\'activité requis'),
  siret: z.string().optional(),
  annualTarget: z.number().min(1000, 'Objectif annuel minimum 1 000€'),
  monthlyTarget: z.number().optional(),
  followUpFrequency: z.number().min(1).max(30),
  notificationSettings: z.object({
    emailAlerts: z.boolean(),
    dashboardReminders: z.boolean(),
    weeklyReport: z.boolean(),
  }),
});

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const STEPS = [
  { id: 1, title: 'Informations Business', description: 'Type d\'entreprise et secteur' },
  { id: 2, title: 'Objectifs Financiers', description: 'Cibles de chiffre d\'affaires' },
  { id: 3, title: 'Préférences CRM', description: 'Configuration et notifications' },
  { id: 4, title: 'Finalisation', description: 'Récapitulatif et validation' },
];

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { saveOnboarding } = useOnboarding();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      businessType: '',
      sector: '',
      siret: '',
      annualTarget: 50000,
      followUpFrequency: 7,
      notificationSettings: {
        emailAlerts: true,
        dashboardReminders: true,
        weeklyReport: true,
      },
    },
  });

  const watchedValues = watch();

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      // Calculer monthlyTarget automatiquement
      const formData = {
        ...data,
        monthlyTarget: Math.round(data.annualTarget / 12),
      };
      
      await saveOnboarding.mutateAsync(formData);
      onComplete?.(); // Appeler onComplete au lieu de onClose
      onClose(); // Forcer également la fermeture directe du modal
    } catch (error) {
      console.error('Erreur onboarding:', error);
    }
  };

  const isStepValid = (step: number) => {
    const values = getValues(); // Utiliser getValues() au lieu de watchedValues
    
    switch (step) {
      case 1:
        // Vérifier que businessType et sector sont sélectionnés et non vides
        return !!(values.businessType && values.businessType.trim() !== '' && 
                 values.sector && values.sector.trim() !== '');
      case 2:
        // Vérifier que l'objectif annuel est défini et >= 1000
        return !!(values.annualTarget && values.annualTarget >= 1000);
      case 3:
        // Vérifier que la fréquence de relance est définie et valide
        return !!(values.followUpFrequency && values.followUpFrequency >= 1 && values.followUpFrequency <= 30);
      case 4:
        // Étape finale - validation globale du formulaire
        return isValid;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessInfoStep
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
      case 2:
        return (
          <TargetsStep
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
      case 3:
        return (
          <PreferencesStep
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        );
      case 4:
        return (
          <FinalStep
            data={watchedValues}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - plus compact */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold">Configuration VelocitaLeads</h2>
            <p className="text-blue-100 text-sm mt-1">Étape {currentStep} sur {STEPS.length}</p>
          </div>

          {/* Step Info - plus compact */}
          <div>
            <h3 className="text-lg font-semibold">{STEPS[currentStep - 1].title}</h3>
            <p className="text-blue-100 text-sm">{STEPS[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
          <div className="flex-1 p-6 overflow-y-auto min-h-0">
            {renderStep()}
          </div>

          {/* Footer - plus compact */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Points de progression */}
              <div className="flex items-center space-x-2">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      step.id < currentStep
                        ? 'bg-green-500'
                        : step.id === currentStep
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Boutons de navigation */}
              <div className="flex items-center space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>
                )}

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Suivant</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!isValid || saveOnboarding.isPending}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {saveOnboarding.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>
                      {saveOnboarding.isPending ? 'Sauvegarde...' : 'Finaliser'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}