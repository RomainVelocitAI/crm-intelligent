import { Building, MapPin, Hash } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { OnboardingFormData, BUSINESS_TYPES, SECTORS } from '@/types/onboarding';

interface BusinessInfoStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
}

export default function BusinessInfoStep({ register, errors, watch, setValue }: BusinessInfoStepProps) {
  const businessType = watch('businessType');
  const sector = watch('sector');

  return (
    <div className="space-y-3">
      {/* Header compact */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Building className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Parlez-nous de votre entreprise
        </h3>
        <p className="text-sm text-gray-600">
          Ces informations personnaliseront votre expérience.
        </p>
      </div>

      {/* Type d'entreprise - compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type d'entreprise *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BUSINESS_TYPES.map((type) => (
            <label
              key={type.value}
              className={`relative flex items-center p-2 border-2 rounded-lg cursor-pointer transition-all ${
                businessType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                {...register('businessType')}
                value={type.value}
                className="sr-only"
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-900">
                  {type.label}
                </span>
              </div>
              {businessType === type.value && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </label>
          ))}
        </div>
        {errors.businessType && (
          <p className="mt-1 text-xs text-red-600">{errors.businessType.message}</p>
        )}
      </div>

      {/* Secteur d'activité - compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Secteur d'activité *
        </label>
        <select
          {...register('sector')}
          className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm ${
            errors.sector ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Sélectionnez votre secteur</option>
          {SECTORS.map((sector) => (
            <option key={sector.value} value={sector.value}>
              {sector.label}
            </option>
          ))}
        </select>
        {errors.sector && (
          <p className="mt-1 text-xs text-red-600">{errors.sector.message}</p>
        )}
      </div>

      {/* SIRET (optionnel) - compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Hash className="w-4 h-4 inline mr-1" />
          SIRET (optionnel)
        </label>
        <input
          type="text"
          {...register('siret')}
          placeholder="12345678901234"
          maxLength={14}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Pour vos documents officiels
        </p>
      </div>

      {/* Confirmation visuelle - ultra compact */}
      {businessType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-xs text-blue-900 font-medium">
            ✓ Configuration pour {BUSINESS_TYPES.find(t => t.value === businessType)?.label}
          </p>
        </div>
      )}
    </div>
  );
}