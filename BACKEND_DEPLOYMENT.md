# 🚀 Guide de Déploiement Backend FixedPronos VIP

## 📋 Prérequis

- Node.js 18+
- PostgreSQL (Neon DB)
- Firebase Project
- Render Account (pour le déploiement)

## 🗄️ Configuration Base de Données

### 1. Créer un compte Neon DB
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez l'URL de connexion PostgreSQL

### 2. Variables d'environnement
```env
DATABASE_URL="postgresql://username:password@hostname:5432/database"
```

## 🔥 Configuration Firebase

### 1. Créer un projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Créez un nouveau projet
3. Activez Authentication avec Google provider

### 2. Générer une clé de service
1. Allez dans Project Settings > Service Accounts
2. Générez une nouvelle clé privée (JSON)
3. Extrayez les valeurs suivantes :

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
```

## 🔧 Installation et Configuration

### 1. Installation des dépendances
```bash
cd backend
npm install
```

### 2. Configuration des variables d'environnement
```bash
cp env.local .env
# Éditez .env avec vos vraies valeurs
```

### 3. Initialisation de la base de données
```bash
# Générer le client Prisma
npm run generate

# Appliquer les migrations
npm run migrate
```

### 4. Créer l'admin
Définissez l'email admin dans `.env` :
```env
ADMIN_EMAIL="votre-email-admin@domain.com"
```

## 🚀 Déploiement sur Render

### 1. Créer un service Web
1. Connectez votre repo GitHub à Render
2. Créez un nouveau Web Service
3. Sélectionnez le dossier `backend`

### 2. Configuration Render
```yaml
# Copiez le contenu de render.yaml
services:
  - type: web
    name: fixed-pronos-backend
    env: node
    region: frankfurt
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: FIREBASE_PROJECT_ID
        sync: false
      - key: FIREBASE_PRIVATE_KEY
        sync: false
      - key: FIREBASE_CLIENT_EMAIL
        sync: false
      - key: ADMIN_EMAIL
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: UPLOAD_PATH
        value: ./uploads
    healthCheckPath: /health
    disk:
      name: uploads
      mountPath: /opt/render/project/src/uploads
      sizeGB: 1
```

### 3. Variables d'environnement sur Render
Ajoutez toutes les variables dans le dashboard Render :
- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `ADMIN_EMAIL`
- `FRONTEND_URL` (URL de votre frontend Vercel)

## 🔑 Configuration Frontend

### 1. Variables d'environnement frontend
```env
VITE_API_URL=https://votre-backend-render.com
```

### 2. Configuration Firebase Frontend
Ajoutez dans votre projet frontend :
```javascript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

## 🎯 Utilisation du Panel Admin

### Accès au panel admin
1. Connectez-vous avec l'email défini dans `ADMIN_EMAIL`
2. Allez sur `/admin`

### Fonctionnalités admin
- **Dashboard** : Statistiques générales
- **Gestion utilisateurs** : Voir tous les utilisateurs
- **Gestion abonnements** : Créer/modifier des abonnements manuellement
- **Gestion pronos** : Créer/publier des pronostics
- **Paiements** : Approuver/rejeter les paiements manuels

## 💰 Système de Paiement Manuel

### Cryptomonnaies
- Adresses statiques définies dans le code
- Upload de preuve de transaction
- Validation manuelle par admin

### Mobile Money
- Numéros de réception fixes
- Upload de preuve de paiement
- Validation manuelle par admin

### Processus de validation
1. Utilisateur soumet paiement avec preuve
2. Admin reçoit notification
3. Admin vérifie la preuve
4. Admin approuve/rejette le paiement
5. Abonnement activé automatiquement si approuvé

## 📊 Commandes Utiles

### Développement
```bash
# Démarrer en développement
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start
```

### Base de données
```bash
# Générer le client Prisma
npm run generate

# Appliquer les migrations
npm run migrate

# Interface graphique Prisma
npm run studio
```

## 🔒 Sécurité

- Authentification Firebase
- Validation admin par email
- Upload de fichiers sécurisé
- CORS configuré
- Variables d'environnement

## 🚨 Points d'attention

1. **Variables Firebase** : Ne jamais commiter les clés privées
2. **Admin Email** : Seul l'email défini peut accéder au panel admin
3. **Uploads** : Les fichiers sont stockés sur Render Disk
4. **Database** : Utilisez l'URL de production Neon pour Render

## 📞 Support

En cas de problème :
1. Vérifiez les logs Render
2. Vérifiez la connectivité à Neon DB
3. Vérifiez les variables d'environnement
4. Testez les endpoints avec Postman

---

**🎉 Votre backend FixedPronos VIP est maintenant déployé !**
