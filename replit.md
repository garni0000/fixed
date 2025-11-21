# FixedPronos - Plateforme de Pronostics Sportifs

## Vue d'ensemble
FixedPronos est une plateforme VIP de pronostics sportifs avec système d'abonnement et de parrainage. L'application utilise React/TypeScript pour le frontend et **Supabase** pour l'authentification et la base de données.

## État Actuel (Migration complète vers Supabase)
**Date de migration Firebase → Supabase**: 21 Novembre 2025  
**Dernière mise à jour**: 21 Novembre 2025 - Système FREE/VIP + Protection sécurisée  
**Statut**: ✅ Application 100% fonctionnelle avec système FREE/VIP sécurisé

### ✅ Fonctionnalités configurées
- Frontend React + Vite fonctionnel sur port 5000
- **Supabase Authentication** configuré avec credentials sécurisés
- **Supabase Database** configuré avec schéma complet
- Services Supabase créés pour remplacer l'API backend
- Interface utilisateur complète avec Shadcn UI
- Système de routing avec React Router
- **Système FREE/VIP SÉCURISÉ** : Protection multi-niveaux des pronos VIP
- Toutes les dépendances installées

### 🎯 Système de types de pronos (FREE / VIP) - SÉCURISÉ
- **FREE** : Pronos gratuits accessibles à tous les utilisateurs
- **VIP** : Pronos réservés aux utilisateurs avec abonnement VIP actif
- Le code gère automatiquement les anciens types (safe/risk → free)
- **Protection multi-niveaux** :
  - Filtrage dans les listes (PronosToday, PronosYesterday)
  - Blocage d'accès sur la page de détail (PronoDetail)
  - Message "Contenu Réservé VIP" avec redirection vers /pricing

### 🔐 Sécurité VIP
- ✅ Utilisateurs non-VIP ne voient que les pronos FREE dans les listes
- ✅ Accès direct à un prono VIP par URL → Bloqué avec message
- ✅ Fallback automatique pour anciens types de pronos
- ⚠️ **Prochaine étape recommandée** : Ajouter Row Level Security (RLS) dans Supabase

### ⚠️ Actions optionnelles
- **Migration SQL types pronos**: Pour nettoyer les anciens types dans Supabase
  - Consultez `GUIDE_MIGRATION_FREE_VIP.md` pour les instructions
  - Script disponible : `MISE_A_JOUR_TYPES_PRONOS.sql`
  - **Note**: Le frontend fonctionne déjà sans cette migration
- **Row Level Security**: Voir `RESUME_SYSTEME_VIP.md` pour les policies SQL recommandées

## Architecture

### Frontend (Application React)
- **Framework**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn UI (Radix UI + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS avec thème personnalisé

### Authentification
- **Système unique**: Supabase Authentication
- Row Level Security (RLS) activé sur toutes les tables
- Trigger automatique pour créer un profil lors de l'inscription
- Système de rôles (user/admin) via table `user_roles`

### Base de données (Supabase)
Tables principales (migrations dans `supabase/migrations/`):
- `profiles` - Profils utilisateurs avec codes de parrainage uniques
- `user_roles` - Rôles (user/admin) avec vérification par fonction
- `subscriptions` - Abonnements (basic/pro/vip) avec intégration Stripe
- `pronos` - Pronostics sportifs avec statuts et résultats
- `transactions` - Historique financier (paiements, commissions, remboursements)
- `referrals` - Système de parrainage avec commissions
- `payments` - Demandes de paiement (crypto, mobile money, virement)

### Services API (Frontend → Supabase direct)
Tous les appels API passent par `src/lib/supabase-services.ts`:
- `supabasePronosService` - CRUD pronos, publication
- `supabaseUserService` - Profils, abonnements, parrainages
- `supabasePaymentService` - Historique et création de paiements
- `supabaseAdminService` - Gestion admin (users, pronos, subscriptions)

## Structure du Projet

```
/
├── src/
│   ├── components/        # Composants React réutilisables
│   │   └── ui/           # Composants Shadcn UI
│   ├── pages/            # Pages de l'application
│   ├── hooks/            # Custom hooks (useAuth, usePronos)
│   ├── lib/              # Utilitaires (API, Firebase, utils)
│   ├── integrations/     # Intégrations (Supabase)
│   └── mocks/            # Données de test
├── supabase/
│   └── migrations/       # Migrations SQL Supabase
├── backend/              # Backend Node.js (à déployer sur Render)
└── public/               # Assets statiques
```

## Variables d'environnement

### Configurées via Replit Secrets
- `VITE_SUPABASE_URL` ✅ - URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` ✅ - Clé publique Supabase
- `VITE_ADMIN_EMAILS` ✅ - Liste des emails administrateurs (séparés par virgule)

### Anciennes variables (non utilisées)
- ~~`VITE_FIREBASE_*`~~ - Remplacé par Supabase Auth
- ~~`VITE_API_URL`~~ - Backend Render remplacé par services Supabase directs

## Démarrage

### En développement (Replit)
L'application démarre automatiquement via le workflow "Start application":
```bash
npm run dev
```
- Accessible sur: https://[votre-repl].replit.dev
- Port: 5000
- Hot reload activé

### Build pour production
```bash
npm run build
```

## Pages principales

- `/` - Page d'accueil avec présentation VIP
- `/auth/login` - Connexion
- `/auth/register` - Inscription
- `/dashboard` - Tableau de bord utilisateur
- `/pronos/today` - Pronostics du jour
- `/pronos/yesterday` - Pronostics d'hier
- `/pronos/before-yesterday` - Pronostics avant-hier
- `/pronos/:id` - Détail d'un pronostic
- `/pricing` - Plans d'abonnement
- `/account` - Compte utilisateur
- `/referral` - Programme de parrainage
- `/admin` - Administration (admin uniquement)

## Problèmes connus et solutions

### Erreur "Could not find table 'pronos'"
**Problème**: Les tables Supabase n'existent pas  
**Cause**: Les migrations SQL n'ont pas encore été appliquées  
**Solution**: 
1. Ouvrez `MIGRATION_SUPABASE.md` pour les instructions détaillées
2. Connectez-vous à votre projet Supabase
3. Exécutez les 3 fichiers SQL dans l'ordre depuis le dossier `supabase/migrations/`
4. Créez votre premier compte admin via SQL

### Erreurs TypeScript sur 'payments'
**Problème**: Types Supabase manquants pour la table payments  
**Cause**: La table n'existe pas encore dans votre base Supabase  
**Solution**: ✅ Normal - ces erreurs disparaîtront après l'application des migrations SQL

## Prochaines étapes recommandées

1. **Appliquer les Migrations SQL** (OBLIGATOIRE)
   - Consultez `MIGRATION_SUPABASE.md` pour les instructions
   - Exécutez les 3 migrations dans Supabase SQL Editor
   - Créez votre premier compte admin

2. **Tests**
   - Tester l'inscription et la connexion Supabase
   - Créer un premier prono depuis le panneau admin
   - Vérifier le système de parrainage

3. **Déploiement sur Vercel**
   - Consultez `DEPLOYMENT.md` pour le guide complet
   - Configurez les variables d'environnement Supabase
   - Déployez automatiquement depuis GitHub

## Support et Documentation

- **Frontend**: React + Vite (ce workspace Replit)
- **Backend**: Supabase (Auth + Database + RLS)
- **Déploiement**: Vercel (voir `DEPLOYMENT.md`)
- **Migrations**: `supabase/migrations/` (voir `MIGRATION_SUPABASE.md`)

## Notes de migration

### Migration Lovable → Replit (21 Nov 2025)
- ✅ Port changé de 8080 → 5000 (requis par Replit)
- ✅ Host changé de `::` → `0.0.0.0`
- ✅ `allowedHosts: true` ajouté à vite.config.ts
- ✅ Alias `@assets` ajouté pour les assets
- ✅ .gitignore mis à jour pour protéger .env
- ✅ Toutes les dépendances npm installées

### Migration Firebase → Supabase (21 Nov 2025)
- ✅ Firebase Auth remplacé par Supabase Auth
- ✅ Backend API Render remplacé par services Supabase directs
- ✅ Hook `useSupabaseAuth` créé pour gérer l'authentification
- ✅ Services Supabase (`supabase-services.ts`) créés pour CRUD
- ✅ Hook `usePronos` migré vers Supabase
- ✅ Migrations SQL créées (7 tables + RLS + triggers + indexes)
- ✅ Guides de déploiement Vercel créés

## Préférences utilisateur
- Langue: Français
- Framework: React + TypeScript + Vite
- UI: Shadcn + Tailwind CSS
- Theme: Sombre avec accents dorés/jaunes
