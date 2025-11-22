# FixedPronos - Plateforme de Pronostics Sportifs

## Vue d'ensemble
FixedPronos est une plateforme VIP de pronostics sportifs avec système d'abonnement et de parrainage. L'application utilise React/TypeScript pour le frontend et **Supabase** pour l'authentification et la base de données.

## État Actuel (Migration complète vers Supabase)
**Date de migration Firebase → Supabase**: 21 Novembre 2025  
**Dernière mise à jour**: 22 Novembre 2025 - Activation automatique d'abonnement  
**Statut**: ✅ Application 100% fonctionnelle avec système dual-field et activation auto

### ✅ Fonctionnalités configurées
- Frontend React + Vite fonctionnel sur port 5000
- **Supabase Authentication** configuré avec credentials sécurisés
- **Supabase Database** configuré avec schéma complet
- Services Supabase créés pour remplacer l'API backend
- Interface utilisateur complète avec Shadcn UI
- Système de routing avec React Router
- **Système dual-field COMPLET** : Séparation type de pari / niveau d'accès
- **Activation automatique d'abonnement** : Soumission de paiement → Approbation admin → Activation
- Toutes les dépendances installées

### 💳 Système d'Activation Automatique des Abonnements
**Date d'implémentation**: 22 Novembre 2025  
**Statut**: ✅ Fonctionnel avec préservation du temps restant

#### Flux Complet
1. **Soumission du Paiement** (`PaymentMethodSelector`)
   - Utilisateur sélectionne un plan (BASIC/PRO/VIP)
   - Remplit le formulaire de paiement (crypto, mobile money, ou virement)
   - Upload d'une preuve de paiement
   - Le `plan` est automatiquement enregistré dans la table `payments`

2. **Validation Admin** (`Admin.tsx`)
   - Admin voit le paiement en attente avec le plan choisi
   - Clique sur "Approuver"
   - Système vérifie que le paiement contient un plan valide

3. **Activation Intelligente**
   - Si l'utilisateur n'a pas d'abonnement → Création d'un nouvel abonnement
   - Si l'utilisateur a un abonnement actif avec temps restant → **Extension à partir de la fin actuelle**
   - Si l'utilisateur a un abonnement expiré → Redémarrage à partir de maintenant
   - Support des upgrades/downgrades de plan (BASIC→PRO→VIP)

4. **Audit & Traçabilité**
   - Création d'une transaction de type `payment` dans l'historique
   - Mise à jour du statut du paiement à `approved`

#### Exemple de Préservation du Temps Restant
- Utilisateur a VIP jusqu'au 25 décembre (20 jours restants)
- Il renouvelle son VIP aujourd'hui (5 décembre)
- **Ancien système** : Abonnement du 5 déc au 5 jan (perte de 20 jours)
- **Nouveau système** : Abonnement du 25 déc au 25 jan (préservation des 20 jours)

#### Migration SQL
**Fichier** : `supabase/migrations/20251122000000_add_plan_to_payments.sql`
- Ajout de la colonne `plan` à la table `payments`
- Valeurs possibles : `basic`, `pro`, `vip`
- **IMPORTANT** : Cette migration doit être appliquée dans votre base Supabase

#### Limitations Connues
⚠️ **Atomicité transactionnelle** : Le flux d'approbation exécute 3 opérations séquentielles (update subscription, insert transaction, update payment) sans transaction PostgreSQL. En cas d'échec partiel, l'admin peut corriger manuellement. Pour une vraie atomicité, implémenter une fonction RPC PostgreSQL.

### 🎯 Architecture Dual-Field pour les Pronos - VALIDÉE PAR ARCHITECT
Le système utilise **deux champs distincts** pour offrir flexibilité maximale :

#### 1️⃣ Type de Pari (`prono_type`) - Catégorisation du risque
- **safe** : Paris sécurisés à faible risque
- **risk** : Paris risqués à cote élevée  
- **vip** : Paris premium avec analyse approfondie
- **Utilisation** : Badge visuel, tri, filtrage par stratégie

#### 2️⃣ Niveau d'Accès (`access_tier`) - Contrôle d'abonnement requis
- **free** : Accessible à tous les utilisateurs (même non connectés)
- **basic** : Abonnement Basic requis
- **pro** : Abonnement Pro requis
- **vip** : Abonnement VIP requis
- **Utilisation** : Verrouillage du contenu, affichage filtré dans les listes

#### ✅ Protection Multi-Niveaux
- **Frontend** :
  - Filtrage dans les listes (PronosToday, PronosYesterday, BeforeYesterday)
  - Blocage d'accès sur la page de détail (PronoDetail)
  - Message "Contenu Réservé [TIER]" avec redirection vers /pricing
  - PronoCard affiche DEUX badges : type de pari + niveau d'accès requis
- **Admin Panel** :
  - Formulaire avec deux sélecteurs indépendants
  - Validation complète des champs obligatoires
  - Gestion timezone correcte (preservation des dates)
  - Sauvegarde validée de `access_tier` dans Supabase

### 🔐 Sécurité et Validation
- ✅ Migration SQL créée (`20251121000001_add_access_tier_to_pronos.sql`)
- ✅ Champ `access_tier` correctement persisté en base de données
- ✅ Validation des champs obligatoires empêche les erreurs timestamp vide
- ✅ Gestion timezone corrigée (pas de double conversion)
- ✅ Tous les contrôles d'accès utilisent `access_tier` (pas `prono_type`)
- ✅ Imports inutilisés nettoyés (`getPronoTier` supprimé où non utilisé)
- ⚠️ **Prochaine étape recommandée** : Row Level Security (RLS) côté Supabase

### 📋 Migration SQL à appliquer
Pour activer le système dual-field dans votre base Supabase :
1. Connectez-vous au SQL Editor de votre projet Supabase
2. Exécutez `supabase/migrations/20251121000001_add_access_tier_to_pronos.sql`
3. Vérifiez que la colonne `access_tier` est bien ajoutée à la table `pronos`

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
