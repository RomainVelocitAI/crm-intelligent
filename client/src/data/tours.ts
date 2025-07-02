import { TutorialTour } from '@/types/tutorial';

export const generalTour: TutorialTour = {
  id: 'general',
  name: 'Tour général',
  description: 'Découvrez l\'interface principale de VelocitaLeads',
  autoStart: true,
  showProgress: true,
  showSkipButton: true,
  steps: [
    {
      target: 'body',
      content: `
        <div>
          <h4 style="font-weight: 600; margin-bottom: 8px;">🎉 Bienvenue dans VelocitaLeads !</h4>
          <p>Je vais vous faire découvrir les fonctionnalités principales de votre nouveau CRM français.</p>
        </div>
      `,
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="navigation"]',
      content: `
        <div>
          <h4 style="font-weight: 600; margin-bottom: 8px;">🧭 Navigation principale</h4>
          <p>Cette barre de navigation vous permet d'accéder rapidement à toutes les sections de VelocitaLeads.</p>
        </div>
      `,
      placement: 'right',
    },
    {
      target: '[data-tour="contacts-tab"]',
      content: `
        <div>
          <h4 style="font-weight: 600; margin-bottom: 8px;">📞 Contacts</h4>
          <p>Gérez tous vos prospects et clients avec leurs métriques de performance calculées automatiquement.</p>
        </div>
      `,
      placement: 'right',
    },
    {
      target: '[data-tour="quotes-tab"]',
      content: `
        <div>
          <h4 style="font-weight: 600; margin-bottom: 8px;">📄 Devis</h4>
          <p>Créez, envoyez et suivez vos devis avec un système de tracking email avancé.</p>
        </div>
      `,
      placement: 'right',
    },
    {
      target: '[data-tour="metrics-tab"]',
      content: `
        <div>
          <h4 style="font-weight: 600; margin-bottom: 8px;">📊 Métriques</h4>
          <p>Analysez vos performances avec des KPIs personnalisés selon vos objectifs d'affaires.</p>
        </div>
      `,
      placement: 'right',
    },
    {
      target: 'body',
      content: `
        <div>
          <h4 style="font-weight: 600; margin-bottom: 8px;">🚀 C'est parti !</h4>
          <p style="margin-bottom: 8px;">Vous pouvez maintenant explorer VelocitaLeads à votre rythme.</p>
          <p style="font-size: 14px; color: #6b7280;">💡 L'icône d'aide vous permettra de relancer les tutoriels à tout moment.</p>
        </div>
      `,
      placement: 'center',
    },
  ],
};

export const contactsTour: TutorialTour = {
  id: 'contacts',
  name: 'Tour Contacts',
  description: 'Apprenez à gérer vos contacts efficacement',
  showProgress: true,
  showSkipButton: true,
  steps: [
    {
      target: '[data-tour="contacts-header"]',
      content: `
        <h4 class="font-semibold mb-2">Gestion des contacts</h4>
        <p>Visualisez tous vos contacts avec leurs métriques calculées automatiquement : CA total, taux de conversion, score de valeur...</p>
      `,
      placement: 'bottom',
    },
    {
      target: '[data-tour="new-contact-button"]',
      content: `
        <h4 class="font-semibold mb-2">➕ Nouveau contact</h4>
        <p>Cliquez ici pour ajouter un nouveau contact. Toutes les métriques seront calculées automatiquement.</p>
      `,
      placement: 'left',
      spotlightClicks: true,
    },
    {
      target: '[data-tour="contacts-search"]',
      content: `
        <h4 class="font-semibold mb-2">🔍 Recherche et filtres</h4>
        <p>Recherchez rapidement par nom, email, entreprise ou filtrez par statut (Actif, Prospect chaud, etc.).</p>
      `,
      placement: 'bottom',
    },
    {
      target: '[data-tour="contact-card"]',
      content: `
        <h4 class="font-semibold mb-2">📇 Fiche contact</h4>
        <p>Chaque contact affiche son statut, score de valeur, CA total et actions rapides. Cliquez sur une carte pour voir les détails.</p>
      `,
      placement: 'top',
      spotlightClicks: true,
    },
    {
      target: '[data-tour="contact-actions"]',
      content: `
        <h4 class="font-semibold mb-2">⚡ Actions rapides</h4>
        <p>Envoyez un email, appelez directement, modifiez ou supprimez un contact en un clic.</p>
      `,
      placement: 'top',
    },
  ],
};

export const quotesTour: TutorialTour = {
  id: 'quotes',
  name: 'Tour Devis',
  description: 'Maîtrisez la création et le suivi de vos devis',
  showProgress: true,
  showSkipButton: true,
  steps: [
    {
      target: '[data-tour="company-info"]',
      content: `
        <h4 class="font-semibold mb-2">🏢 Informations entreprise</h4>
        <p>Renseignez les informations de votre entreprise qui apparaîtront sur tous vos devis professionnels.</p>
      `,
      placement: 'bottom',
    },
    {
      target: '[data-tour="new-quote-button"]',
      content: `
        <h4 class="font-semibold mb-2">📝 Créer un devis</h4>
        <p>Cliquez ici pour créer un nouveau devis professionnel avec calculs automatiques et génération PDF.</p>
      `,
      placement: 'top',
      spotlightClicks: true,
    },
    {
      target: '[data-tour="quote-actions"]',
      content: `
        <h4 class="font-semibold mb-2">🚀 Actions devis</h4>
        <p>Téléchargez en PDF, dupliquez, envoyez par email ou téléchargez vos devis finalisés.</p>
      `,
      placement: 'top',
    },
  ],
};

export const metricsTour: TutorialTour = {
  id: 'metrics',
  name: 'Tour Métriques',
  description: 'Exploitez vos données pour optimiser vos performances',
  showProgress: true,
  showSkipButton: true,
  steps: [
    {
      target: '[data-tour="metrics-header"]',
      content: `
        <h4 class="font-semibold mb-2">Dashboard analytics</h4>
        <p>Analysez vos performances avec des KPIs personnalisés selon vos objectifs définis lors de l'onboarding.</p>
      `,
      placement: 'bottom',
    },
    {
      target: '[data-tour="period-selector"]',
      content: `
        <h4 class="font-semibold mb-2">📅 Période d'analyse</h4>
        <p>Changez la période d'analyse (7, 30, 90 jours) pour adapter vos métriques selon vos besoins.</p>
      `,
      placement: 'left',
    },
    {
      target: '[data-tour="objective-progress"]',
      content: `
        <h4 class="font-semibold mb-2">🎯 Suivi d'objectifs</h4>
        <p>Votre progression vers votre objectif annuel avec calculs automatiques du rythme mensuel et projections.</p>
      `,
      placement: 'bottom',
    },
    {
      target: '[data-tour="pipeline-visual"]',
      content: `
        <h4 class="font-semibold mb-2">🔄 Pipeline visuel</h4>
        <p>Visualisez votre tunnel de conversion : Contacts → Devis → Acceptés avec taux de transformation.</p>
      `,
      placement: 'top',
    },
    {
      target: '[data-tour="revenue-chart"]',
      content: `
        <h4 class="font-semibold mb-2">📈 Évolution du CA</h4>
        <p>Graphique style bourse avec couleurs dynamiques (vert=hausse, rouge=baisse) et statistiques de trading.</p>
      `,
      placement: 'top',
    },
    {
      target: '[data-tour="kpis-grid"]',
      content: `
        <h4 class="font-semibold mb-2">📊 KPIs interactifs</h4>
        <p>Survolez les KPIs pour voir les détails : contacts actifs, devis en attente, pipeline value, taux d'ouverture...</p>
      `,
      placement: 'top',
    },
  ],
};

export const allTours = {
  general: generalTour,
  contacts: contactsTour,
  quotes: quotesTour,
  metrics: metricsTour,
};