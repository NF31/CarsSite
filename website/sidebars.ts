import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar pour la documentation CarRental
 * Organise les fichiers markdown en catégories logiques selon la nouvelle structure
 * Note: Docusaurus ignore les préfixes numériques dans les noms de fichiers
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro', // Page d'introduction
    
    // 🚀 Getting Started - Guides de démarrage
    {
      type: 'category',
      label: '🚀 Getting Started',
      items: [
        'getting-started/stripe-setup',
        'getting-started/stripe-branding-setup',
        'getting-started/google-maps-setup',
        'getting-started/redis-integration',
        'getting-started/redis-cache-strategy',
        'getting-started/NEXTAUTH_STRUCTURE',
        'getting-started/lancer-webhook-stripe',
      ],
    },
    
    // 📋 Requirements - Spécifications fonctionnelles
    {
      type: 'category',
      label: '📋 Requirements',
      items: [
        'requirements/user-stories-complete',
      ],
    },
    
    // 📐 Specs - Spécifications techniques
    {
      type: 'category',
      label: '📐 Specifications',
      items: [
        'specs/technical-specifications',
      ],
    },
    
    // 🏗️ Architecture - Architecture et structure
    {
      type: 'category',
      label: '🏗️ Architecture',
      items: [
        'architecture/global-architecture-overview',
        'architecture/admin-directory-structure',
        'architecture/data-models',
        'architecture/data-dictionary',
        'architecture/prisma-schema',
      ],
    },
    
    // 🎨 Design - Design et UX
    {
      type: 'category',
      label: '🎨 Design & UX',
      items: [
        'design/design-system',
        'design/content-strategy',
        'design/user-experience-design',
        'design/competitive-analysis',
      ],
    },
    
    // 🎛️ Admin Interface - Interface admin
    {
      type: 'category',
      label: '🎛️ Admin Interface',
      items: [
        'admin-interface/admin-interface-detailed',
        'admin-interface/admin-navbar-dashboard',
      ],
    },
    
    // 🔄 Workflows - Workflows métier
    {
      type: 'category',
      label: '🔄 Workflows',
      items: [
        'workflows/workflows-detailed',
        'workflows/workflow-reservation-complet',
        'workflows/workflow-annulation-reservation',
        'workflows/workflow-modification-dates-complet',
        'workflows/workflow-modification-dates',
        'workflows/workflow-remboursement-complet',
        'workflows/guide-verification-remboursement',
        'workflows/workflows-webhook-stripe',
        'workflows/ordre-execution-webhook',
        'workflows/logs-workflow-complet',
        'workflows/explication-calcul-modification-dates',
        'workflows/verification-flux-et-cache',
      ],
    },
    
    // 📖 Reference - Documentation de référence
    {
      type: 'category',
      label: '📖 Reference',
      items: [
        'reference/api-reference-complete',
        'reference/implementation-examples',
        'reference/insurance-services-detailed',
        'reference/account-deletion-process',
      ],
    },
    
    // 🗺️ Roadmap - Planification
    {
      type: 'category',
      label: '🗺️ Roadmap',
      items: [
        'roadmap/roadmap-projet',
      ],
    },
    
    // ✅ Status - Statut du projet
    {
      type: 'category',
      label: '✅ Project Status',
      items: [
        'status/documentation-checklist',
        'status/complete-documentation-review',
        'status/final-readiness-assessment',
        'status/complete-project-status',
        'status/documentation-update-summary',
        'status/etat-projet-mvp',
      ],
    },
  ],
};

export default sidebars;
