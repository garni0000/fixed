# FixedPronos - Frontend VIP Premium

Frontend complet d'une application de pronostics sportifs VIP avec design noir & or premium.

## 🚀 Technologies

- **Vite** - Build ultra-rapide
- **React 18** - UI Library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling premium
- **React Query** - Data fetching & caching
- **React Router** - Navigation
- **Axios** - API calls
- **Shadcn/ui** - Components UI

## 📁 Structure du projet

```
src/
├── pages/               # Pages de l'application
│   ├── Index.tsx       # Landing page
│   ├── Login.tsx       # Page de connexion
│   ├── Register.tsx    # Page d'inscription
│   ├── Dashboard.tsx   # Tableau de bord
│   ├── PronosToday.tsx # Pronos du jour
│   ├── PronosYesterday.tsx
│   ├── PronosBeforeYesterday.tsx
│   ├── PronoDetail.tsx # Détail d'un prono
│   ├── Account.tsx     # Compte utilisateur
│   └── Referral.tsx    # Programme de parrainage
├── components/         # Composants réutilisables
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── PronoCard.tsx
├── hooks/              # Custom hooks
│   ├── useAuth.ts      # Authentification
│   └── usePronos.ts    # Gestion des pronos
├── lib/                # Utilities
│   └── api.ts          # Configuration API
├── mocks/              # Mock data
│   ├── pronos.json
│   └── user.json
└── index.css           # Design system
```

## 🎨 Design System

Le projet utilise un design system premium avec :
- **Couleurs** : Noir profond (#0F0F14) + Or VIP (#D4AF37)
- **Typographie** : Bold & élégante
- **Animations** : Smooth & subtiles
- **Cards** : Effet shine au hover
- **Buttons** : Style VIP avec glow effect

Tous les styles sont définis dans `src/index.css` et `tailwind.config.ts`.

## 🔧 Installation

```bash
# Installation des dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview
```

## 🌐 Configuration API

### Mode Mock (par défaut)
L'application utilise des données mock si `VITE_API_URL` n'est pas défini.

### Connexion au Backend
1. Créer un fichier `.env` :
```env
VITE_API_URL=https://votre-api.com
```

2. L'API doit exposer ces endpoints :

**Auth**
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription

**Pronos**
- `GET /pronos?date=YYYY-MM-DD` - Liste des pronos
- `GET /pronos/:id` - Détail d'un prono

**User**
- `GET /user/profile` - Profil utilisateur

## 📱 Pages Implémentées

### ✅ Public
- **/** - Landing page premium avec hero, features, pronos du jour
- **/auth/login** - Page de connexion
- **/auth/register** - Page d'inscription

### 🔒 Protégées (nécessite connexion)
- **/dashboard** - Tableau de bord avec stats & pronos
- **/pronos/today** - Pronos du jour
- **/pronos/yesterday** - Pronos d'hier
- **/pronos/before-yesterday** - Pronos d'avant-hier
- **/pronos/:id** - Détail complet d'un prono
- **/account** - Gestion du compte & abonnement
- **/referral** - Programme de parrainage

## 🎯 Features Implémentées

- ✅ Design premium VIP (noir & or)
- ✅ Système d'authentification complet
- ✅ Dashboard avec statistiques
- ✅ Gestion des pronos (aujourd'hui, hier, avant-hier)
- ✅ Page détail avec analyse complète
- ✅ Gestion du compte utilisateur
- ✅ Système d'abonnement
- ✅ Programme de parrainage (30% commission)
- ✅ Mock API intégré
- ✅ React Query pour le caching
- ✅ Responsive mobile-first
- ✅ Animations & transitions smooth
- ✅ Toast notifications
- ✅ Loading states

## 📦 Déploiement Vercel

1. Push le code sur GitHub
2. Connecter le repo sur Vercel
3. Configurer les variables d'environnement si besoin
4. Deploy automatique !

## 🔐 Authentification Mock

Pour tester l'authentification en mode mock :
- Email : n'importe quel email valide
- Password : n'importe quel mot de passe

L'utilisateur mock aura accès à toutes les features avec des données de test.

## 📊 Données Mock

Les données mock incluent :
- 6 pronos (3 aujourd'hui, 2 hier, 1 avant-hier)
- Utilisateur avec abonnement VIP actif
- Statistiques de paris
- Historique de paiements
- Code de parrainage

## 🎨 Personnalisation

### Couleurs
Modifier `src/index.css` :
```css
--primary: 45 93% 58%; /* Or VIP */
--background: 240 10% 3.9%; /* Noir profond */
```

### Logo
Remplacer l'icône Trophy dans `Header.tsx` par votre logo custom.

## 🚧 Prochaines étapes

Une fois le backend connecté :
1. Retirer les mock data
2. Implémenter la vraie logique de paiement
3. Ajouter les notifications temps réel
4. Implémenter le chat support
5. Ajouter les statistiques avancées

## 📄 License

Propriétaire - FixedPronos © 2025

---

**Note** : Ce frontend est 100% prêt à être connecté à votre backend. Il suffit de configurer `VITE_API_URL` !
