# FixedPronos - Plateforme de Pronostics Sportifs

## Vue d'ensemble
FixedPronos est une plateforme VIP de pronostics sportifs avec système d'abonnement et de parrainage. L'application utilise React/TypeScript pour le frontend, Firebase pour l'authentification, et Supabase comme base de données.

## État Actuel (Migré depuis Lovable vers Replit)
**Date de migration**: 21 Novembre 2025  
**Statut**: ✅ Opérationnel

### ✅ Fonctionnalités configurées
- Frontend React + Vite fonctionnel sur port 5000
- Firebase Authentication configuré avec credentials sécurisés
- Supabase intégré pour la base de données
- Interface utilisateur complète avec Shadcn UI
- Système de routing avec React Router
- Toutes les dépendances installées

### ⚠️ Configuration requise
- **VITE_API_URL**: Doit pointer vers le backend Render réel (actuellement en placeholder)
- **Backend**: Nécessite un backend Node.js déployé sur Render pour les opérations complètes

## Architecture

### Frontend (Application React)
- **Framework**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn UI (Radix UI + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS avec thème personnalisé

### Authentification
- **Primary**: Firebase Authentication
- **Secondary**: Supabase (base de données avec RLS)
- Les deux systèmes coexistent - Firebase pour l'auth, Supabase pour les données

### Base de données (Supabase)
Tables principales:
- `profiles` - Profils utilisateurs avec codes de parrainage
- `user_roles` - Rôles (user/admin)
- `subscriptions` - Abonnements (basic/pro/vip)
- `pronos` - Pronostics sportifs
- `transactions` - Historique des paiements
- `referrals` - Système de parrainage

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
- `VITE_FIREBASE_API_KEY` ✅
- `VITE_FIREBASE_AUTH_DOMAIN` ✅
- `VITE_FIREBASE_PROJECT_ID` ✅
- `VITE_FIREBASE_STORAGE_BUCKET` ✅
- `VITE_FIREBASE_MESSAGING_SENDER_ID` ✅
- `VITE_FIREBASE_APP_ID` ✅
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_PUBLISHABLE_KEY` ✅
- `VITE_API_URL` ⚠️ (Mettre à jour avec l'URL Render réelle)

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

### Erreur CORS avec le backend
**Problème**: `Access-Control-Allow-Origin` header manquant  
**Cause**: URL du backend incorrecte ou backend non configuré  
**Solution**: 
1. Vérifier que le backend est déployé sur Render
2. Mettre à jour `VITE_API_URL` dans les secrets Replit
3. Configurer CORS dans le backend pour autoriser l'origine Replit

### Erreur Firebase "invalid-api-key"
**Problème**: Firebase ne peut pas s'initialiser  
**Cause**: Credentials Firebase manquants ou incorrects  
**Solution**: ✅ Résolu - Credentials configurés via Replit Secrets

## Prochaines étapes recommandées

1. **Backend API**
   - Vérifier que le backend Render est accessible
   - Mettre à jour `VITE_API_URL` avec l'URL correcte
   - Configurer les CORS pour accepter les requêtes Replit

2. **Tests**
   - Tester la création de compte
   - Tester la connexion
   - Vérifier les abonnements

3. **Déploiement**
   - Publier via Replit Deployments pour une URL permanente
   - Configurer un domaine personnalisé si besoin

## Support et Documentation

- Frontend déployé: Replit (ce workspace)
- Backend: Render (à configurer)
- Base de données: Supabase
- Authentication: Firebase

## Notes de migration depuis Lovable

- ✅ Port changé de 8080 → 5000 (requis par Replit)
- ✅ Host changé de `::` → `0.0.0.0`
- ✅ `allowedHosts: true` ajouté à vite.config.ts
- ✅ Firebase package installé
- ✅ Alias `@assets` ajouté pour les assets
- ✅ .gitignore mis à jour pour protéger .env
- ✅ Toutes les dépendances npm installées

## Préférences utilisateur
- Langue: Français
- Framework: React + TypeScript + Vite
- UI: Shadcn + Tailwind CSS
- Theme: Sombre avec accents dorés/jaunes
