import { Settings, Clock, Bell, Mail, Calendar } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { OnboardingFormData } from '@/types/onboarding';

interface PreferencesStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
}

const FOLLOW_UP_OPTIONS = [
  { value: 7, label: '7j', description: 'Recommandé' },
  { value: 14, label: '14j', description: 'Modéré' },
  { value: 30, label: '30j', description: 'Minimal' },
];

export default function PreferencesStep({ register, errors, watch, setValue }: PreferencesStepProps) {
  const followUpFrequency = watch('followUpFrequency');
  const notificationSettings = watch('notificationSettings');

  const handleFollowUpClick = (value: number) => {
    setValue('followUpFrequency', value);
  };

  const handleNotificationChange = (key: keyof typeof notificationSettings, value: boolean) => {
    setValue('notificationSettings', {
      ...notificationSettings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-3">
      {/* Header compact */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Settings className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Configurez vos préférences
        </h3>
        <p className="text-sm text-gray-600">
          Personnalisez le comportement selon vos habitudes.
        </p>
      </div>

      {/* Fréquence de relance - ultra compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          Fréquence de relance *
        </label>
        <p className="text-xs text-gray-600 mb-2">
          Délai avant de relancer un prospect
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          {FOLLOW_UP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFollowUpClick(option.value)}
              className={`p-2 border-2 rounded-lg text-center transition-all ${
                followUpFrequency === option.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-bold text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
        
        {errors.followUpFrequency && (
          <p className="mt-1 text-xs text-red-600">{errors.followUpFrequency.message}</p>
        )}
      </div>

      {/* Notifications - compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Bell className="w-4 h-4 inline mr-1" />
          Notifications
        </label>

        <div className="space-y-2">
          {/* Email Alerts */}
          <div className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailAlerts}
                onChange={(e) => handleNotificationChange('emailAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900">Alertes email</span>
              </div>
              <p className="text-xs text-gray-600">
                Devis ouvert, accepté ou refusé
              </p>
            </div>
          </div>

          {/* Dashboard Reminders */}
          <div className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.dashboardReminders}
                onChange={(e) => handleNotificationChange('dashboardReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-900">Rappels</span>
              </div>
              <p className="text-xs text-gray-600">
                Actions importantes
              </p>
            </div>
          </div>

          {/* Weekly Report */}
          <div className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.weeklyReport}
                onChange={(e) => handleNotificationChange('weeklyReport', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Rapport hebdo</span>
              </div>
              <p className="text-xs text-gray-600">
                Résumé performances
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Récapitulatif - compact */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
        <h4 className="text-xs font-medium text-gray-900 mb-2">
          Récapitulatif
        </h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Relance :</span>
            <span className="font-medium">
              {followUpFrequency} jour{followUpFrequency > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Notifications :</span>
            <span className="font-medium">
              {Object.values(notificationSettings).filter(Boolean).length} / 3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}