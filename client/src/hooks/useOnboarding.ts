import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { UserPreferences, OnboardingFormData } from '@/types/onboarding';
import toast from 'react-hot-toast';

// Service API pour l'onboarding
const onboardingService = {
  saveOnboarding: async (data: OnboardingFormData) => {
    const response = await api.post('/onboarding', data);
    return response.data;
  },

  getUserPreferences: async () => {
    const response = await api.get('/onboarding/preferences');
    return response.data;
  },

  updatePreferences: async (data: Partial<OnboardingFormData>) => {
    const response = await api.put('/onboarding/preferences', data);
    return response.data;
  },

  saveTutorialProgress: async (data: { tutorialStep: string; completed: boolean; progress?: any }) => {
    const response = await api.post('/onboarding/tutorial-progress', data);
    return response.data;
  },

  getTutorialProgress: async () => {
    const response = await api.get('/onboarding/tutorial-progress');
    return response.data;
  },

  saveUserPreferences: async (data: { tutorialPreferences?: any; [key: string]: any }) => {
    const response = await api.put('/onboarding/preferences', data);
    return response.data;
  },
};

export function useOnboarding() {
  const queryClient = useQueryClient();

  // Query pour récupérer les préférences utilisateur
  const { data: userPreferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: onboardingService.getUserPreferences,
  });

  // Mutation pour sauvegarder l'onboarding
  const saveOnboardingMutation = useMutation({
    mutationFn: onboardingService.saveOnboarding,
    onSuccess: (data) => {
      toast.success('Onboarding complété avec succès !');
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'onboarding');
    },
  });

  // Mutation pour mettre à jour les préférences
  const updatePreferencesMutation = useMutation({
    mutationFn: onboardingService.updatePreferences,
    onSuccess: () => {
      toast.success('Préférences mises à jour');
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  return {
    userPreferences: userPreferences?.data,
    isLoadingPreferences,
    saveOnboarding: saveOnboardingMutation,
    updatePreferences: updatePreferencesMutation,
  };
}

export function useTutorial() {
  const queryClient = useQueryClient();

  // Query pour récupérer les préférences utilisateur (incluant tutorialPreferences)
  const { data: userPreferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: onboardingService.getUserPreferences,
  });

  // Query pour récupérer la progression du tutorial
  const { data: tutorialProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['tutorialProgress'],
    queryFn: onboardingService.getTutorialProgress,
  });

  // Mutation pour sauvegarder la progression
  const saveTutorialProgressMutation = useMutation({
    mutationFn: onboardingService.saveTutorialProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorialProgress'] });
    },
    onError: (error: any) => {
      console.error('Erreur lors de la sauvegarde de la progression:', error);
    },
  });

  // Mutation pour sauvegarder les préférences utilisateur
  const saveUserPreferencesMutation = useMutation({
    mutationFn: onboardingService.saveUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['tutorialProgress'] });
    },
    onError: (error: any) => {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
    },
  });

  return {
    userPreferences: userPreferences?.data,
    tutorialProgress: tutorialProgress?.data || {},
    isLoadingPreferences,
    isLoadingProgress,
    saveTutorialProgress: saveTutorialProgressMutation,
    saveUserPreferences: saveUserPreferencesMutation,
  };
}