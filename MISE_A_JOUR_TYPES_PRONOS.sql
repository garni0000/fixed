-- ============================================
-- MISE À JOUR DES TYPES DE PRONOS
-- Exécutez ce SQL dans Supabase pour passer de safe/risk/vip → free/vip
-- ============================================

-- Étape 1: Mettre à jour tous les pronos existants 'safe' et 'risk' → 'free'
UPDATE public.pronos 
SET prono_type = 'safe' 
WHERE prono_type IN ('safe', 'risk');

-- Étape 2: Supprimer l'ancien enum et en créer un nouveau
ALTER TYPE public.prono_type RENAME TO prono_type_old;

CREATE TYPE public.prono_type AS ENUM ('free', 'vip');

-- Étape 3: Mettre à jour la colonne pour utiliser le nouvel enum
ALTER TABLE public.pronos 
  ALTER COLUMN prono_type TYPE public.prono_type 
  USING (
    CASE 
      WHEN prono_type::text = 'vip' THEN 'vip'::public.prono_type
      ELSE 'free'::public.prono_type
    END
  );

-- Étape 4: Définir la valeur par défaut
ALTER TABLE public.pronos 
  ALTER COLUMN prono_type SET DEFAULT 'free'::public.prono_type;

-- Étape 5: Supprimer l'ancien enum
DROP TYPE public.prono_type_old;

-- Vérification
SELECT prono_type, COUNT(*) 
FROM public.pronos 
GROUP BY prono_type;
