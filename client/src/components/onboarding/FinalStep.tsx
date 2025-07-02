import { CheckCircle, Building, Target, Settings, Sparkles } from 'lucide-react';
import { OnboardingFormData, BUSINESS_TYPES, SECTORS } from '@/types/onboarding';

interface FinalStepProps {
  data: OnboardingFormData;
}

export default function FinalStep({ data }: FinalStepProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const businessTypeLabel = BUSINESS_TYPES.find(t => t.value === data.businessType)?.label;
  const sectorLabel = SECTORS.find(s => s.value === data.sector)?.label;
  const monthlyTarget = data.annualTarget ? Math.round(data.annualTarget / 12) : 0;

  return (
    <div className="space-y-3">
      {/* Header compact */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Configuration terminée !
        </h3>
        <p className="text-sm text-gray-600">
          Vérifiez vos informations avant de finaliser.
        </p>
      </div>

      {/* Récapitulatif ultra compact */}
      <div className="space-y-3">
        {/* Informations Business */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Building className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900">Business</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-blue-700">Type :</span>
              <p className="text-blue-900 font-medium">{businessTypeLabel}</p>
            </div>
            <div>
              <span className="text-blue-700">Secteur :</span>
              <p className="text-blue-900 font-medium">{sectorLabel}</p>
            </div>
            {data.siret && (
              <div className="col-span-2">
                <span className="text-blue-700">SIRET :</span>
                <p className="text-blue-900 font-medium">{data.siret}</p>
              </div>
            )}
          </div>
        </div>

        {/* Objectifs Financiers */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-semibold text-green-900">Objectifs</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-white rounded shadow-sm">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(data.annualTarget)}
              </div>
              <div className="text-xs text-gray-600">Annuel</div>
            </div>
            <div className="text-center p-2 bg-white rounded shadow-sm">
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(monthlyTarget)}
              </div>
              <div className="text-xs text-gray-600">Mensuel</div>
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-purple-900">Préférences</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-purple-700">Relance :</span>
              <span className="text-purple-900 font-medium">
                {data.followUpFrequency} jour{data.followUpFrequency > 1 ? 's' : ''}
              </span>
            </div>
            <div>
              <span className="text-purple-700 mb-1 block">Notifications :</span>
              <div className="flex flex-wrap gap-1">
                {data.notificationSettings.emailAlerts && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Email
                  </span>
                )}
                {data.notificationSettings.dashboardReminders && (
                  <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Rappels
                  </span>
                )}
                {data.notificationSettings.weeklyReport && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Rapport
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message final */}
        <div className="text-center p-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg text-white">
          <Sparkles className="w-6 h-6 mx-auto mb-2" />
          <h4 className="text-sm font-semibold mb-1">
            Prêt à booster votre activité ?
          </h4>
          <p className="text-xs text-green-100">
            VelocitaLeads est configuré selon vos besoins !
          </p>
        </div>
      </div>
    </div>
  );
}