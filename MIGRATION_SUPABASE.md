# 🚀 Instructions Rapides - Appliquer les Migrations Supabase

## ⚠️ IMPORTANT

Votre application est configurée pour utiliser Supabase, mais les **tables n'existent pas encore** dans votre base de données.  
Vous devez appliquer les migrations SQL manuellement dans votre tableau de bord Supabase.

---

## 📋 Étapes à Suivre

### 1️⃣ Connexion à Supabase

1. Allez sur : https://app.supabase.com
2. Sélectionnez votre projet **FixedPronos**
3. Dans le menu de gauche, cliquez sur **SQL Editor** (icône SQL)

### 2️⃣ Exécuter les Migrations

Vous devez exécuter **3 fichiers SQL** dans l'ordre :

#### Migration 1 : Structure Principale ✅

1. Ouvrez le fichier : `supabase/migrations/20251120123208_83afb0f9-99a2-4384-8f66-2fc57a808ad5.sql`
2. Copiez **tout le contenu**
3. Dans Supabase SQL Editor :
   - Cliquez sur **"New Query"**
   - Collez le contenu
   - Cliquez sur **"Run"** (ou `Ctrl+Enter`)
4. ✅ Attendez le message de confirmation

#### Migration 2 : Corrections de Sécurité ✅

1. Ouvrez le fichier : `supabase/migrations/20251120123239_7a1643b9-1792-4310-83fd-db7d23074060.sql`
2. Copiez **tout le contenu**
3. Dans Supabase SQL Editor :
   - Cliquez sur **"New Query"**
   - Collez le contenu
   - Cliquez sur **"Run"**
4. ✅ Attendez le message de confirmation

#### Migration 3 : Table Paiements ✅

1. Ouvrez le fichier : `supabase/migrations/20251121000000_add_payments_table.sql`
2. Copiez **tout le contenu**
3. Dans Supabase SQL Editor :
   - Cliquez sur **"New Query"**
   - Collez le contenu
   - Cliquez sur **"Run"**
4. ✅ Attendez le message de confirmation

---

### 3️⃣ Créer votre Compte Admin

Une fois les migrations appliquées :

1. **Inscrivez-vous** dans l'application FixedPronos avec votre email admin
2. **Retournez dans Supabase SQL Editor**
3. **Exécutez cette requête** (remplacez `votre-email@example.com`) :

```sql
-- Créer le rôle admin pour votre compte
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'votre-email@example.com'),
  'admin'::public.app_role
);
```

4. ✅ Vous êtes maintenant admin !

---

### 4️⃣ Vérification

Pour vérifier que tout est correctement installé, exécutez cette requête :

```sql
-- Lister toutes les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Vous devriez voir** :
- ✅ `payments`
- ✅ `profiles`
- ✅ `pronos`
- ✅ `referrals`
- ✅ `subscriptions`
- ✅ `transactions`
- ✅ `user_roles`

---

### 5️⃣ Régénérer les Types TypeScript Supabase (CRUCIAL)

**⚠️ ÉTAPE OBLIGATOIRE** - Sans cette étape, l'application ne fonctionnera pas !

Après avoir appliqué toutes les migrations, vous devez régénérer les types TypeScript :

```bash
# Dans votre terminal local (Replit ou local)
npx supabase gen types typescript --project-id votre-project-id > src/integrations/supabase/types.ts
```

> 📍 **Où trouver votre project-id ?**
> - Dans l'URL Supabase : `https://app.supabase.com/project/VOTRE-PROJECT-ID`
> - Ou dans Settings → General → Reference ID

**Puis committez et poussez le fichier mis à jour :**

```bash
git add src/integrations/supabase/types.ts
git commit -m "Update Supabase types after migrations"
git push
```

✅ Les erreurs TypeScript sur 'payments' disparaîtront maintenant !

---

## 🎯 Que font ces Migrations ?

### Migration 1 : Structure Complète
- ✅ Crée les **types ENUM** (rôles, statuts, plans...)
- ✅ Crée les **7 tables principales**
- ✅ Configure les **politiques RLS** (sécurité)
- ✅ Crée les **triggers automatiques** (profils, timestamps)
- ✅ Ajoute les **indexes** pour la performance

### Migration 2 : Sécurité
- ✅ Corrige les avertissements de sécurité PostgreSQL
- ✅ Ajoute `search_path` aux fonctions

### Migration 3 : Paiements
- ✅ Ajoute la table `payments`
- ✅ Configure les méthodes de paiement (crypto, mobile money, virement)
- ✅ Sécurise avec RLS

---

## 🔥 Après l'Application des Migrations

Une fois les migrations appliquées, **redémarrez votre application** :

1. Dans Replit, cliquez sur le bouton **Stop** puis **Run**
2. Ou rechargez simplement la page de votre application

**Tout devrait fonctionner ! 🎉**

- ✅ Les pronos s'afficheront sur la page d'accueil
- ✅ Vous pourrez créer des pronos depuis le panneau admin
- ✅ Les utilisateurs pourront s'inscrire et s'abonner
- ✅ Le système de parrainage sera actif

---

## ❓ Problèmes Fréquents

### Erreur : "relation already exists"
**Cause** : Vous essayez de réexécuter une migration déjà appliquée  
**Solution** : Ignorez l'erreur, la table existe déjà

### Erreur : "permission denied"
**Cause** : Problème de droits dans Supabase  
**Solution** : Assurez-vous d'être connecté en tant que propriétaire du projet

### Les tables n'apparaissent pas
**Solution** : 
1. Rafraîchissez la page Supabase
2. Allez dans **Database → Tables** pour voir toutes les tables
3. Si elles n'y sont pas, réexécutez les migrations

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans Supabase SQL Editor
2. Consultez la documentation : https://supabase.com/docs
3. Posez une question dans les discussions GitHub

---

## ✅ C'est Fait ?

Si toutes les migrations sont appliquées et que vous voyez les 7 tables dans Supabase, **vous êtes prêt ! 🚀**

Votre application FixedPronos fonctionne maintenant avec Supabase et est prête à être déployée sur Vercel !

➡️ Consultez le fichier `DEPLOYMENT.md` pour les instructions de déploiement sur Vercel.
