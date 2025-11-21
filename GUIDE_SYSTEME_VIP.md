# 🎯 Guide Complet : Système FREE / VIP

## 📋 Comment ça fonctionne

### 1. Les PRONOS ont un TYPE
- **FREE** : Visible par TOUT LE MONDE (visiteurs + utilisateurs connectés)
- **VIP** : Visible UNIQUEMENT par les utilisateurs avec abonnement VIP actif

### 2. Les UTILISATEURS ont un ABONNEMENT
- **basic** : Abonnement de base (peut voir les pronos FREE uniquement)
- **pro** : Abonnement pro (peut voir les pronos FREE uniquement)
- **vip** : Abonnement VIP (peut voir les pronos FREE + VIP)

---

## 👥 Gérer les abonnements utilisateurs (Admin)

### Étape 1 : Accédez à l'interface Admin
1. Connectez-vous avec votre compte admin (`marious10102002@gmail.com`)
2. Allez sur `/admin`
3. Cliquez sur l'onglet **"Utilisateurs"**

### Étape 2 : Liste des utilisateurs
Vous verrez un tableau avec :
- **Email** : Email de l'utilisateur
- **Nom** : Prénom + Nom
- **Abonnement** : Plan actuel (basic/pro/vip) + Statut (active/inactive)
- **Rôle** : User ou Admin
- **Actions** : Boutons pour modifier

### Étape 3 : Donner un abonnement VIP
1. Trouvez l'utilisateur dans la liste
2. Cliquez sur **"Modifier Abonnement"**
3. Dans le dialogue qui s'ouvre :
   - **Plan** : Sélectionnez **VIP**
   - **Durée (mois)** : Entrez le nombre de mois (ex: 1, 3, 6, 12)
4. Cliquez sur **"Mettre à jour"**

### Résultat
- L'utilisateur a maintenant accès VIP pendant X mois
- Il peut voir TOUS les pronos (FREE + VIP)
- Son abonnement expire automatiquement après la durée définie

---

## 🎮 Créer des pronos FREE et VIP (Admin)

### Créer un prono FREE (gratuit)
1. Allez sur `/admin`
2. Onglet **"Pronos"**
3. Cliquez **"Nouveau Prono"**
4. Remplissez le formulaire
5. **Type** : Sélectionnez **FREE (Gratuit)**
6. **Statut** : Publié
7. Cliquez **"Créer le Prono"**

✅ **Ce prono sera visible par TOUS** (visiteurs + users)

### Créer un prono VIP (payant)
1. Même processus
2. **Type** : Sélectionnez **VIP (Abonnés)**
3. **Statut** : Publié

🔒 **Ce prono sera visible UNIQUEMENT par les utilisateurs VIP**

---

## 🔍 Où sont les pronos affichés ?

Les pronos apparaissent sur ces pages :
- `/` : Page d'accueil (derniers pronos)
- `/pronos/today` : Pronos du jour
- `/pronos/yesterday` : Pronos d'hier
- `/pronos/before-yesterday` : Pronos avant-hier
- `/dashboard` : Tableau de bord utilisateur

### Logique de filtrage (À implémenter)

**ACTUELLEMENT** : Tous les pronos s'affichent pour tout le monde

**À FAIRE** : Filtrer les pronos VIP pour les non-abonnés
```typescript
// Dans chaque page de pronos
const filteredPronos = pronos.filter(prono => {
  // Si le prono est FREE, tout le monde peut le voir
  if (prono.prono_type === 'free') return true;
  
  // Si le prono est VIP, vérifier l'abonnement
  if (prono.prono_type === 'vip') {
    return user?.subscription?.plan === 'vip' && 
           user?.subscription?.status === 'active';
  }
  
  return false;
});
```

---

## 🧪 Tester le système

### Test 1 : Créer un utilisateur VIP
1. Créez un nouveau compte utilisateur (ou utilisez un existant)
2. Connectez-vous en admin
3. Allez sur `/admin` → Utilisateurs
4. Donnez-lui un abonnement VIP pour 1 mois

### Test 2 : Créer des pronos
1. Créez 2 pronos :
   - 1 prono **FREE**
   - 1 prono **VIP**
2. Publiez les deux

### Test 3 : Vérifier l'accès
1. **En tant qu'admin** : Vous voyez les 2 pronos
2. **En tant qu'utilisateur VIP** : Vous voyez les 2 pronos
3. **En tant qu'utilisateur basic** : Vous devriez voir UNIQUEMENT le prono FREE
4. **En tant que visiteur** : Vous devriez voir UNIQUEMENT le prono FREE

---

## 🔧 Gestion des abonnements

### Expiration automatique
- Supabase calcule automatiquement si un abonnement est expiré
- Champ `current_period_end` dans la table `subscriptions`
- Quand la date est dépassée, le statut passe de `active` → `expired`

### Prolonger un abonnement
1. Cliquez sur **"Modifier Abonnement"**
2. Sélectionnez le plan (VIP)
3. Entrez la nouvelle durée (cela REMPLACE l'abonnement actuel)
4. Cliquez **"Mettre à jour"**

### Révoquer un abonnement
1. Modifiez l'abonnement
2. Sélectionnez **basic**
3. Durée : 1 mois
4. Cliquez **"Mettre à jour"**

---

## 💰 Cas d'usage typique

### Scénario : Un utilisateur paie pour 1 mois VIP

1. **L'utilisateur paie** (Stripe, PayPal, etc.)
2. **Webhook reçu** → Backend crée/met à jour l'abonnement
3. **Admin vérifie** : 
   - Va sur `/admin` → Utilisateurs
   - Clique "Modifier Abonnement"
   - Plan : VIP
   - Durée : 1 mois
   - Cliquez "Mettre à jour"
4. **L'utilisateur a accès** : Il peut voir tous les pronos VIP pendant 1 mois

---

## 🐛 Dépannage

### Les utilisateurs ne se chargent pas
✅ **CORRIGÉ** : La fonction `loadUsers` a été mise à jour

### Les pronos VIP sont visibles par tous
⚠️ **À FAIRE** : Implémenter le filtrage dans le frontend (voir section "Logique de filtrage")

### L'abonnement n'expire pas
- Vérifiez que la date `current_period_end` est correcte dans Supabase
- Le système vérifie automatiquement le statut à chaque connexion

---

## 📊 Base de données

### Table `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  plan TEXT CHECK (plan IN ('basic', 'pro', 'vip')),
  status TEXT CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `pronos`
```sql
CREATE TABLE pronos (
  id UUID PRIMARY KEY,
  prono_type TEXT CHECK (prono_type IN ('free', 'vip')),
  -- autres champs...
);
```

---

## ✅ Résumé

| Élément | Description | Valeurs possibles |
|---------|-------------|-------------------|
| **Prono TYPE** | Qui peut voir ce prono | `free`, `vip` |
| **User PLAN** | Niveau d'abonnement | `basic`, `pro`, `vip` |
| **Sub STATUS** | État de l'abonnement | `active`, `expired`, `canceled` |

**Règle d'or** :
- Prono FREE → Visible par tous
- Prono VIP → Visible uniquement si (plan = 'vip' ET status = 'active')

---

## 📝 Prochaines étapes

1. ✅ Corriger le chargement des utilisateurs (FAIT)
2. ⚠️ Implémenter le filtrage des pronos VIP dans le frontend
3. ⚠️ Ajouter une indication visuelle "🔒 VIP" sur les pronos verrouillés
4. ⚠️ Créer une page de paiement pour acheter un abonnement VIP

**Rechargez `/admin` et testez la gestion des abonnements !** 🎉
