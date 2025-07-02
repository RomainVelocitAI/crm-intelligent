export interface TutorialStep {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
  styles?: {
    options?: any;
    tooltip?: any;
    spotlightLegacy?: any;
  };
}

export interface TutorialTour {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  autoStart?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
}

export interface TutorialState {
  currentTour: string | null;
  stepIndex: number;
  isRunning: boolean;
  completedTours: string[];
  skippedTours: string[];
}

export const TUTORIAL_TOURS = {
  GENERAL: 'general',
  CONTACTS: 'contacts', 
  QUOTES: 'quotes',
  METRICS: 'metrics',
} as const;