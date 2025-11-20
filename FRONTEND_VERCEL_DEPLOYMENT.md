# 🚀 Déploiement Frontend FixedPronos VIP sur Vercel

## 📋 Prérequis

- Compte GitHub avec votre projet poussé
- Compte Vercel (gratuit)
- Backend déjà déployé sur Render
- Configuration Firebase prête

## 🔧 Configuration Firebase Frontend

### 1. Créer/Utiliser un projet Firebase existant
1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Créez un nouveau projet ou utilisez un existant
3. Activez **Authentication** avec le provider **Google**

### 2. Configuration Web App
1. Dans votre projet Firebase, cliquez sur l'icône `</>` (Web)
2. Enregistrez une nouvelle app web
3. Copiez la configuration :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 3. Variables d'environnement
Créez un fichier `.env.local` dans votre projet :

```env
# Backend API (Render)
VITE_API_URL=https://votre-backend-render.onrender.com

# Firebase Frontend
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 🚀 Déploiement sur Vercel

### Étape 1 : Connexion à Vercel

1. **Allez sur Vercel** : [vercel.com](https://vercel.com)
2. **Connectez-vous** avec votre compte GitHub
3. **Cliquez "Import Project"**

### Étape 2 : Configuration du projet

1. **Sélectionnez votre repository GitHub**
   - Choisissez `fixed-pronos-vip-main`
   - Assurez-vous que c'est le bon repo

2. **Configurez le projet :**
   - **Framework Preset** : `Vite`
   - **Root Directory** : `./` (racine du projet)
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

### Étape 3 : Variables d'environnement

Dans l'onglet "Environment Variables", ajoutez :

```
VITE_API_URL=https://votre-backend-render.onrender.com
VITE_FIREBASE_API_KEY=votre-api-key
VITE_FIREBASE_AUTH_DOMAIN=votre-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-project-id
VITE_FIREBASE_STORAGE_BUCKET=votre-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre-sender-id
VITE_FIREBASE_APP_ID=votre-app-id
```

### Étape 4 : Déploiement

1. **Cliquez "Deploy"**
2. **Attendez la fin du build** (2-3 minutes)
3. **Votre site sera accessible** à une URL comme :
   ```
   https://fixed-pronos-vip.vercel.app
   ```

## 🔄 Mise à jour automatique

Vercel déploie automatiquement à chaque push sur la branche `main` :
- Push vers GitHub → Build automatique sur Vercel
- Temps de déploiement : ~2-3 minutes

## ⚙️ Configuration avancée (optionnel)

### Domaines personnalisés

1. **Dans Vercel Dashboard** > votre projet > Settings > Domains
2. **Ajoutez votre domaine** (ex: `fixedpronos.com`)
3. **Configurez les DNS** selon les instructions de Vercel

### Build Settings personnalisés

Si vous voulez modifier la configuration, éditez `vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🔍 Vérifications après déploiement

### Testez ces pages :
- **/** - Page d'accueil
- **/auth/login** - Connexion
- **/auth/register** - Inscription
- **/pricing** - Abonnement

### Testez l'API :
- Vérifiez que les appels API vont bien vers Render
- Testez l'authentification Firebase
- Testez les paiements (devraient aller vers le backend)

## 🆘 Dépannage

### Build échoue :
1. Vérifiez les logs dans Vercel Dashboard
2. Assurez-vous que toutes les variables d'environnement sont définies
3. Testez le build localement : `npm run build`

### API ne fonctionne pas :
1. Vérifiez que `VITE_API_URL` pointe vers votre backend Render
2. Testez l'endpoint `/health` de votre backend
3. Vérifiez la console du navigateur pour les erreurs CORS

### Authentification ne marche pas :
1. Vérifiez la configuration Firebase
2. Assurez-vous que Authentication est activé dans Firebase Console
3. Vérifiez que le domaine est autorisé dans Firebase

## 📊 Performance

Vercel optimise automatiquement :
- ✅ CDN mondial
- ✅ Compression automatique
- ✅ Cache intelligent
- ✅ HTTPS gratuit
- ✅ Analytics intégrés

## 🎉 Résumé

Après déploiement, vous aurez :

- **Frontend** : `https://votre-app.vercel.app`
- **Backend** : `https://votre-backend.onrender.com`
- **Base de données** : Neon PostgreSQL
- **Authentification** : Firebase
- **Paiements** : Manuels (Crypto + Mobile Money)

Votre application FixedPronos VIP est maintenant 100% déployée ! 🚀
