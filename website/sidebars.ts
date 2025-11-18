import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar pour la documentation CarRental
 * Organise les 29 fichiers markdown en catégories logiques
 * Note: Docusaurus ignore les préfixes numériques dans les noms de fichiers
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro', // Page d'introduction
    // Introduction et Vue d'ensemble
    {
      type: 'category',
      label: '📋 Introduction',
      items: [
        'user-stories-complete',
        'technical-specifications',
        'user-experience-design',
        'roadmap-projet',
      ],
    },
    
    // Architecture et Structure
    {
      type: 'category',
      label: '🏗️ Architecture',
      items: [
        'global-architecture-overview',
        'admin-directory-structure',
        'data-models',
        'data-dictionary',
        'prisma-schema',
      ],
    },
    
    // Interface Admin
    {
      type: 'category',
      label: '🎛️ Interface Admin',
      items: [
        'admin-interface-detailed',
        'admin-navbar-dashboard',
      ],
    },
    
    // API et Implémentation
    {
      type: 'category',
      label: '🔌 API & Implémentation',
      items: [
        'api-reference-complete',
        'implementation-examples',
      ],
    },
    
    // Workflows et Processus
    {
      type: 'category',
      label: '🔄 Workflows',
      items: [
        'workflows-detailed',
        'workflow-modification-dates',
        'account-deletion-process',
      ],
    },
    
    // Services et Fonctionnalités
    {
      type: 'category',
      label: '🛡️ Services',
      items: [
        'insurance-services-detailed',
      ],
    },
    
    // Design et UX
    {
      type: 'category',
      label: '🎨 Design & UX',
      items: [
        'design-system',
        'content-strategy',
        'competitive-analysis',
      ],
    },
    
    // Configuration et Setup
    {
      type: 'category',
      label: '⚙️ Configuration',
      items: [
        'NEXTAUTH_STRUCTURE',
        'stripe-setup',
        'stripe-branding-setup',
        'google-maps-setup',
        'redis-integration',
        'redis-cache-strategy',
      ],
    },
    
    // Évaluation et Statut
    {
      type: 'category',
      label: '✅ Évaluation',
      items: [
        'documentation-checklist',
        'complete-documentation-review',
        'final-readiness-assessment',
        'complete-project-status',
        'documentation-update-summary',
      ],
    },
  ],
};

export default sidebars;
