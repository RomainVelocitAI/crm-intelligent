import { Target, Calculator, Euro } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { OnboardingFormData } from '@/types/onboarding';

interface TargetsStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
}

const PRESET_TARGETS = [
  { value: 30000, label: '30k€', description: 'Freelance' },
  { value: 50000, label: '50k€', description: 'Expérimenté' },
  { value: 100000, label: '100k€', description: 'TPE' },
  { value: 200000, label: '200k€', description: 'PME' },
];

export default function TargetsStep({ register, errors, watch, setValue }: TargetsStepProps) {
  const annualTarget = watch('annualTarget');
  const monthlyTarget = annualTarget ? Math.round(annualTarget / 12) : 0;
  const weeklyTarget = monthlyTarget ? Math.round(monthlyTarget / 4.33) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePresetClick = (value: number) => {
    setValue('annualTarget', value);
  };

  return (
    <div className="space-y-3">
      {/* Header compact */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Target className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Définissons vos objectifs
        </h3>
        <p className="text-sm text-gray-600">
          Fixez votre objectif de CA pour personnaliser vos KPIs.
        </p>
      </div>

      {/* Objectifs prédéfinis - compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objectifs prédéfinis
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_TARGETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              className={`p-2 border-2 rounded-lg text-center transition-all text-xs ${
                annualTarget === preset.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900">{preset.label}</div>
              <div className="text-xs text-gray-500">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Objectif personnalisé - compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Euro className="w-4 h-4 inline mr-1" />
          Objectif annuel personnalisé *
        </label>
        <div className="relative">
          <input
            type="number"
            {...register('annualTarget', { valueAsNumber: true })}
            placeholder="50000"
            min="1000"
            step="1000"
            className={`w-full px-3 py-2 pl-10 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
              errors.annualTarget ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        {errors.annualTarget && (
          <p className="mt-1 text-xs text-red-600">{errors.annualTarget.message}</p>
        )}
      </div>

      {/* Résultats + Jauge - ultra compact */}
      {annualTarget >= 1000 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
          <h4 className="text-xs font-medium text-green-900 mb-2 flex items-center">
            <Calculator className="w-3 h-3 mr-1" />
            Répartition automatique
          </h4>
          
          {/* Résultats sur 3 colonnes */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-white rounded shadow-sm">
              <div className="text-sm font-bold text-green-600">
                {formatCurrency(annualTarget)}
              </div>
              <div className="text-xs text-gray-600">Annuel</div>
            </div>
            <div className="text-center p-2 bg-white rounded shadow-sm">
              <div className="text-sm font-bold text-blue-600">
                {formatCurrency(monthlyTarget)}
              </div>
              <div className="text-xs text-gray-600">Mensuel</div>
            </div>
            <div className="text-center p-2 bg-white rounded shadow-sm">
              <div className="text-sm font-bold text-purple-600">
                {formatCurrency(weeklyTarget)}
              </div>
              <div className="text-xs text-gray-600">Hebdo</div>
            </div>
          </div>

          {/* Jauge compacte */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progression (30%)</span>
              <span>{formatCurrency(annualTarget * 0.3)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: '30%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}