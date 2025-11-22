import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Plus, Edit, Trash2, Users, TrendingUp, DollarSign, CreditCard, Check, X, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabaseComboService } from '@/lib/supabase-services';
import { Checkbox } from '@/components/ui/checkbox';

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard stats
  const [stats, setStats] = useState({ totalUsers: 0, activeSubscriptions: 0, totalRevenue: 0, totalPronos: 0 });

  // Pronos
  const [pronos, setPronos] = useState<any[]>([]);
  const [pronoForm, setPronoForm] = useState({
    title: '', sport: '', competition: '', match_time: '', home_team: '', away_team: '',
    tip: '', odd: '', confidence: '', prono_type: 'safe', access_tier: 'free', content: '', analysis: '', status: 'draft'
  });
  const [editingProno, setEditingProno] = useState<any>(null);
  const [isPronoDialogOpen, setIsPronoDialogOpen] = useState(false);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userSubForm, setUserSubForm] = useState({ plan: 'basic', duration: '1' });

  // Payments
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Combos
  const [combos, setCombos] = useState<any[]>([]);
  const [comboForm, setComboForm] = useState({
    title: '', description: '', global_odds: '', stake: '', access_tier: 'free', match_date: '',
    selectedPronoIds: [] as string[], couponImage: null as File | null
  });
  const [editingCombo, setEditingCombo] = useState<any>(null);
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'pronos' && isAdmin) loadPronos();
    if (activeTab === 'combos' && isAdmin) { loadCombos(); loadPronos(); } // Charger combos + pronos pour sélection
    if (activeTab === 'users' && isAdmin) loadUsers();
    if (activeTab === 'payments' && isAdmin) loadPayments();
  }, [activeTab, isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login');
        return;
      }

      console.log('Checking admin access for:', user.email);

      // Liste des emails administrateurs (stockée dans les variables d'environnement)
      const adminEmailsString = import.meta.env.VITE_ADMIN_EMAILS || '';
      const adminEmails = adminEmailsString.split(',').map((email: string) => email.trim());
      
      const isAdmin = adminEmails.includes(user.email || '');
      console.log('Is admin?', isAdmin, 'Admin emails:', adminEmails);

      if (!isAdmin) {
        toast({ 
          title: 'Accès refusé', 
          description: 'Vous devez être admin pour accéder à cette page.', 
          variant: 'destructive' 
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      loadDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [usersRes, subsRes, transRes, pronosRes] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('subscriptions').select('id, status').eq('status', 'active'),
        supabase.from('transactions').select('amount').eq('type', 'payment').eq('status', 'completed'),
        supabase.from('pronos').select('id')
      ]);

      const totalRevenue = transRes.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalUsers: usersRes.data?.length || 0,
        activeSubscriptions: subsRes.data?.length || 0,
        totalRevenue,
        totalPronos: pronosRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadPronos = async () => {
    try {
      const { data, error } = await supabase
        .from('pronos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPronos(data || []);
    } catch (error) {
      console.error('Error loading pronos:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les pronos.', variant: 'destructive' });
    }
  };

  const loadCombos = async () => {
    try {
      const { data } = await supabaseComboService.getCombos();
      setCombos(data || []);
    } catch (error) {
      console.error('Error loading combos:', error);
      // Silently fail if table doesn't exist yet (waiting for migration)
    }
  };

  const loadUsers = async () => {
    try {
      // Charger les profils
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Charger les abonnements
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*');

      // Charger les rôles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*');

      // Joindre les données
      const usersWithDetails = (profilesData || []).map(profile => {
        const subscription = (subscriptionsData || []).find(sub => sub.user_id === profile.id);
        const roleData = (rolesData || []).find(role => role.user_id === profile.id);
        
        return {
          ...profile,
          subscriptions: subscription ? [subscription] : [],
          user_roles: roleData ? [roleData] : []
        };
      });

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les utilisateurs.', variant: 'destructive' });
    }
  };

  const loadPayments = async () => {
    try {
      console.log('📋 Loading payments...');
      
      // Charger les paiements
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('💳 Payments data:', paymentsData);
      console.log('❌ Payments error:', paymentsError);

      if (paymentsError) throw paymentsError;

      // Charger les profils
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');

      console.log('👤 Profiles data:', profilesData);

      // Joindre les données
      const paymentsWithProfiles = (paymentsData || []).map(payment => {
        const profile = (profilesData || []).find(p => p.id === payment.user_id);
        return {
          ...payment,
          profiles: profile
        };
      });

      console.log('✅ Final payments with profiles:', paymentsWithProfiles);
      setPayments(paymentsWithProfiles);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les paiements.', variant: 'destructive' });
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Récupérer les détails du paiement
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Paiement introuvable');
      }

      // Validation: Vérifier que le plan est défini
      if (!payment.plan || !['basic', 'pro', 'vip'].includes(payment.plan)) {
        throw new Error('Le paiement ne contient pas de plan d\'abonnement valide');
      }

      // 2. Vérifier si l'utilisateur a déjà un abonnement
      const now = new Date();
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', payment.user_id)
        .single();

      let startDate: Date;
      let endDate: Date;

      if (existingSubscription && existingSubscription.status === 'active') {
        // L'utilisateur a déjà un abonnement actif
        const currentEndDate = new Date(existingSubscription.current_period_end);
        
        // Si l'abonnement actuel a encore du temps restant, on prolonge à partir de sa fin
        if (currentEndDate > now) {
          startDate = currentEndDate; // Commencer après la fin de l'abonnement actuel
          endDate = new Date(currentEndDate);
          endDate.setMonth(endDate.getMonth() + 1); // +1 mois à partir de la fin actuelle
        } else {
          // L'abonnement est expiré, repartir de maintenant
          startDate = now;
          endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Mettre à jour l'abonnement existant
        const { error: updateSubError } = await supabase
          .from('subscriptions')
          .update({
            plan: payment.plan, // Permettre l'upgrade/downgrade
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            cancel_at_period_end: false
          })
          .eq('user_id', payment.user_id);

        if (updateSubError) throw updateSubError;
      } else {
        // Pas d'abonnement actif, créer un nouveau
        startDate = now;
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);

        const { error: createSubError } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: payment.user_id,
            plan: payment.plan,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            cancel_at_period_end: false
          }]);

        if (createSubError) throw createSubError;
      }

      // 4. Créer une transaction pour tracer le paiement
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: payment.user_id,
          type: 'payment',
          amount: payment.amount,
          status: 'completed',
          description: `Paiement pour abonnement ${payment.plan.toUpperCase()}`
        }]);

      if (transactionError) {
        console.error('Warning: Transaction creation failed:', transactionError);
        // Ne pas bloquer l'approbation si la transaction échoue
      }

      // 5. Approuver le paiement
      const { error: approveError } = await supabase
        .from('payments')
        .update({
          status: 'approved',
          processed_by: user.id,
          processed_at: now.toISOString()
        })
        .eq('id', paymentId);

      if (approveError) throw approveError;

      toast({ 
        title: 'Succès', 
        description: `Paiement approuvé et abonnement ${payment.plan.toUpperCase()} activé avec succès.` 
      });
      loadPayments();
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible d\'approuver le paiement et d\'activer l\'abonnement.', 
        variant: 'destructive' 
      });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('payments')
        .update({
          status: 'rejected',
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({ title: 'Succès', description: 'Paiement rejeté.' });
      loadPayments();
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({ title: 'Erreur', description: 'Impossible de rejeter le paiement.', variant: 'destructive' });
    }
  };

  const handleSaveProno = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validation des champs obligatoires
      if (!pronoForm.title || !pronoForm.sport || !pronoForm.competition || !pronoForm.match_time ||
          !pronoForm.home_team || !pronoForm.away_team || !pronoForm.tip || !pronoForm.odd || !pronoForm.confidence) {
        toast({ title: 'Erreur', description: 'Tous les champs obligatoires doivent être remplis', variant: 'destructive' });
        return;
      }

      // Convertir le datetime-local en UTC ISO (new Date interprète automatiquement comme heure locale)
      const matchTimeUTC = new Date(pronoForm.match_time).toISOString();

      const pronoData = {
        ...pronoForm,
        match_time: matchTimeUTC,
        odd: parseFloat(pronoForm.odd),
        confidence: parseInt(pronoForm.confidence),
        prono_type: pronoForm.prono_type as 'safe' | 'risk' | 'vip',
        access_tier: pronoForm.access_tier as 'free' | 'basic' | 'pro' | 'vip',
        status: pronoForm.status as 'draft' | 'published' | 'archived',
        author_id: user.id,
        published_at: pronoForm.status === 'published' ? new Date().toISOString() : null
      };

      if (editingProno) {
        const { error } = await supabase
          .from('pronos')
          .update(pronoData)
          .eq('id', editingProno.id);

        if (error) throw error;
        toast({ title: 'Succès', description: 'Prono mis à jour avec succès!' });
      } else {
        const { error } = await supabase
          .from('pronos')
          .insert([pronoData]);

        if (error) throw error;
        toast({ title: 'Succès', description: 'Prono créé avec succès!' });
      }

      setIsPronoDialogOpen(false);
      resetPronoForm();
      loadPronos();
    } catch (error: any) {
      console.error('Error saving prono:', error);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteProno = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prono ?')) return;

    try {
      const { error } = await supabase.from('pronos').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Prono supprimé avec succès!' });
      loadPronos();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const resetPronoForm = () => {
    setPronoForm({
      title: '', sport: '', competition: '', match_time: '', home_team: '', away_team: '',
      tip: '', odd: '', confidence: '', prono_type: 'safe', access_tier: 'free', content: '', analysis: '', status: 'draft'
    });
    setEditingProno(null);
  };

  const handleEditProno = (prono: any) => {
    setEditingProno(prono);
    // Convertir le timestamp UTC en datetime-local en préservant l'heure locale
    let matchTime = '';
    if (prono.match_time) {
      const date = new Date(prono.match_time);
      // Convertir en format YYYY-MM-DDTHH:MM pour datetime-local
      matchTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }
    setPronoForm({
      title: prono.title,
      sport: prono.sport,
      competition: prono.competition,
      match_time: matchTime,
      home_team: prono.home_team,
      away_team: prono.away_team,
      tip: prono.tip,
      odd: prono.odd.toString(),
      confidence: prono.confidence.toString(),
      prono_type: prono.prono_type,
      access_tier: prono.access_tier || 'free',
      content: prono.content || '',
      analysis: prono.analysis || '',
      status: prono.status
    });
    setIsPronoDialogOpen(true);
  };

  const handleUpdateUserSubscription = async () => {
    if (!selectedUser) return;

    try {
      const durationMonths = parseInt(userSubForm.duration);
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: selectedUser.id,
          plan: userSubForm.plan as 'basic' | 'pro' | 'vip',
          status: 'active' as 'active' | 'canceled' | 'expired' | 'pending',
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString()
        });

      if (error) throw error;

      toast({ title: 'Succès', description: 'Abonnement mis à jour avec succès!' });
      setIsUserDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleAdminRole = async (userId: string, currentIsAdmin: boolean) => {
    try {
      if (currentIsAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }

      toast({ title: 'Succès', description: currentIsAdmin ? 'Rôle admin retiré' : 'Rôle admin attribué' });
      loadUsers();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateCombo = async () => {
    try {
      if (!comboForm.title || !comboForm.global_odds || !comboForm.match_date) {
        toast({ 
          title: 'Validation', 
          description: 'Veuillez remplir tous les champs requis (titre, cote, date).', 
          variant: 'destructive' 
        });
        return;
      }

      if (comboForm.selectedPronoIds.length === 0) {
        toast({ 
          title: 'Validation', 
          description: 'Veuillez sélectionner au moins un prono pour le combo.', 
          variant: 'destructive' 
        });
        return;
      }

      setLoading(true);

      // Créer le combo avec upload d'image optionnel
      const { data } = await supabaseComboService.createCombo({
        title: comboForm.title,
        description: comboForm.description,
        global_odds: parseFloat(comboForm.global_odds),
        stake: parseFloat(comboForm.stake) || 0,
        potential_win: parseFloat(comboForm.stake || '0') * parseFloat(comboForm.global_odds),
        access_tier: comboForm.access_tier as 'free' | 'basic' | 'pro' | 'vip',
        match_date: comboForm.match_date,
        pronoIds: comboForm.selectedPronoIds,
        couponImage: comboForm.couponImage || undefined
      });

      toast({ 
        title: 'Succès ✓', 
        description: `Combo "${comboForm.title}" créé avec succès!` 
      });

      // Réinitialiser le formulaire
      setComboForm({
        title: '', description: '', global_odds: '', stake: '', 
        access_tier: 'free', match_date: '',
        selectedPronoIds: [], couponImage: null
      });

      // Recharger la liste des combos
      loadCombos();
    } catch (error: any) {
      console.error('Error creating combo:', error);
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Impossible de créer le combo.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCombo = (combo: any) => {
    setEditingCombo(combo);
    setComboForm({
      title: combo.title,
      description: combo.description || '',
      global_odds: combo.global_odds.toString(),
      stake: combo.stake?.toString() || '',
      access_tier: combo.access_tier,
      match_date: combo.match_date ? new Date(combo.match_date).toISOString().slice(0, 16) : '',
      selectedPronoIds: [], // Ne pas précharger les pronos sélectionnés (complexe avec la liaison)
      couponImage: null
    });
    setIsComboDialogOpen(true);
  };

  const handleUpdateCombo = async () => {
    if (!editingCombo) return;

    try {
      if (!comboForm.title || !comboForm.global_odds || !comboForm.match_date) {
        toast({ 
          title: 'Validation', 
          description: 'Veuillez remplir tous les champs requis (titre, cote, date).', 
          variant: 'destructive' 
        });
        return;
      }

      setLoading(true);

      await supabaseComboService.updateCombo(editingCombo.id, {
        title: comboForm.title,
        description: comboForm.description,
        global_odds: parseFloat(comboForm.global_odds),
        stake: parseFloat(comboForm.stake) || 0,
        potential_win: parseFloat(comboForm.stake || '0') * parseFloat(comboForm.global_odds),
        access_tier: comboForm.access_tier as 'free' | 'basic' | 'pro' | 'vip',
        match_date: comboForm.match_date,
        couponImage: comboForm.couponImage || undefined
      });

      toast({ 
        title: 'Succès ✓', 
        description: `Combo "${comboForm.title}" mis à jour!` 
      });

      setIsComboDialogOpen(false);
      setEditingCombo(null);
      setComboForm({
        title: '', description: '', global_odds: '', stake: '', 
        access_tier: 'free', match_date: '',
        selectedPronoIds: [], couponImage: null
      });
      loadCombos();
    } catch (error: any) {
      console.error('Error updating combo:', error);
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Impossible de mettre à jour le combo.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCombo = async (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le combo "${title}" ?`)) return;

    try {
      await supabaseComboService.deleteCombo(id);
      toast({ 
        title: 'Succès ✓', 
        description: `Combo "${title}" supprimé avec succès!` 
      });
      loadCombos();
    } catch (error: any) {
      console.error('Error deleting combo:', error);
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Impossible de supprimer le combo.', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateComboStatus = async (id: string, newStatus: 'pending' | 'won' | 'lost') => {
    try {
      await supabaseComboService.updateCombo(id, { status: newStatus });
      toast({ 
        title: 'Succès ✓', 
        description: `Statut du combo mis à jour: ${newStatus === 'won' ? 'Gagné' : newStatus === 'lost' ? 'Perdu' : 'En cours'}` 
      });
      loadCombos();
    } catch (error: any) {
      console.error('Error updating combo status:', error);
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Impossible de mettre à jour le statut.', 
        variant: 'destructive' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Panel d'Administration</h1>
          <p className="text-muted-foreground">Gestion complète de FixedPronos</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="pronos">Pronos</TabsTrigger>
            <TabsTrigger value="combos">Combos</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pronos Publiés</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPronos}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pronos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Gestion des Pronos</CardTitle>
                    <CardDescription>Créer et gérer tous les pronostics</CardDescription>
                  </div>
                  <Dialog open={isPronoDialogOpen} onOpenChange={setIsPronoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetPronoForm}>
                        <Plus className="h-4 w-4 mr-2" /> Nouveau Prono
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingProno ? 'Modifier' : 'Créer'} un Prono</DialogTitle>
                        <DialogDescription>Remplissez tous les champs du pronostic</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Titre</Label>
                            <Input value={pronoForm.title} onChange={(e) => setPronoForm({ ...pronoForm, title: e.target.value })} />
                          </div>
                          <div>
                            <Label>Sport</Label>
                            <Input value={pronoForm.sport} onChange={(e) => setPronoForm({ ...pronoForm, sport: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Compétition</Label>
                            <Input value={pronoForm.competition} onChange={(e) => setPronoForm({ ...pronoForm, competition: e.target.value })} />
                          </div>
                          <div>
                            <Label>Date du match</Label>
                            <Input type="datetime-local" value={pronoForm.match_time} onChange={(e) => setPronoForm({ ...pronoForm, match_time: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Équipe domicile</Label>
                            <Input value={pronoForm.home_team} onChange={(e) => setPronoForm({ ...pronoForm, home_team: e.target.value })} />
                          </div>
                          <div>
                            <Label>Équipe extérieur</Label>
                            <Input value={pronoForm.away_team} onChange={(e) => setPronoForm({ ...pronoForm, away_team: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Pronostic</Label>
                            <Input value={pronoForm.tip} onChange={(e) => setPronoForm({ ...pronoForm, tip: e.target.value })} />
                          </div>
                          <div>
                            <Label>Cote</Label>
                            <Input type="number" step="0.01" value={pronoForm.odd} onChange={(e) => setPronoForm({ ...pronoForm, odd: e.target.value })} />
                          </div>
                          <div>
                            <Label>Confiance (%)</Label>
                            <Input type="number" min="0" max="100" value={pronoForm.confidence} onChange={(e) => setPronoForm({ ...pronoForm, confidence: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Type de pari</Label>
                            <Select value={pronoForm.prono_type} onValueChange={(value) => setPronoForm({ ...pronoForm, prono_type: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="safe">Safe (Faible risque)</SelectItem>
                                <SelectItem value="risk">Risk (Risque élevé)</SelectItem>
                                <SelectItem value="vip">VIP (Exclusif)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Niveau d'accès requis</Label>
                            <Select value={pronoForm.access_tier} onValueChange={(value) => setPronoForm({ ...pronoForm, access_tier: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">FREE (Gratuit)</SelectItem>
                                <SelectItem value="basic">BASIC (Abonnement Basic)</SelectItem>
                                <SelectItem value="pro">PRO (Abonnement Pro)</SelectItem>
                                <SelectItem value="vip">VIP (Abonnement VIP)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Statut</Label>
                            <Select value={pronoForm.status} onValueChange={(value) => setPronoForm({ ...pronoForm, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Brouillon</SelectItem>
                                <SelectItem value="published">Publié</SelectItem>
                                <SelectItem value="archived">Archivé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Contenu</Label>
                          <Textarea value={pronoForm.content} onChange={(e) => setPronoForm({ ...pronoForm, content: e.target.value })} rows={3} />
                        </div>
                        <div>
                          <Label>Analyse</Label>
                          <Textarea value={pronoForm.analysis} onChange={(e) => setPronoForm({ ...pronoForm, analysis: e.target.value })} rows={3} />
                        </div>
                        <Button onClick={handleSaveProno}>
                          {editingProno ? 'Mettre à jour' : 'Créer'} le Prono
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Cote</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pronos.map((prono) => (
                      <TableRow key={prono.id}>
                        <TableCell>{prono.home_team} vs {prono.away_team}</TableCell>
                        <TableCell>{prono.tip}</TableCell>
                        <TableCell>{prono.odd}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              prono.prono_type === 'vip' ? 'default' :
                              prono.prono_type === 'risk' ? 'destructive' :
                              'outline'
                            }
                            className={
                              prono.prono_type === 'vip' ? 'text-primary' :
                              prono.prono_type === 'risk' ? '' :
                              'text-success'
                            }
                          >
                            {prono.prono_type === 'safe' ? 'SAFE' :
                             prono.prono_type === 'risk' ? 'RISK' :
                             'VIP'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={prono.status === 'published' ? 'default' : 'outline'}>
                            {prono.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditProno(prono)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteProno(prono.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <CardDescription>Gérer les abonnements et rôles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Abonnement</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                        <TableCell>
                          {user.subscriptions?.[0] ? (
                            <Badge variant={user.subscriptions[0].status === 'active' ? 'default' : 'secondary'}>
                              {user.subscriptions[0].plan} - {user.subscriptions[0].status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Aucun</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.user_roles?.some((r: any) => r.role === 'admin') ? 'destructive' : 'secondary'}>
                            {user.user_roles?.some((r: any) => r.role === 'admin') ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog open={isUserDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                              setIsUserDialogOpen(open);
                              if (open) setSelectedUser(user);
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">Modifier Abonnement</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier l'abonnement de {user.email}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4">
                                  <div>
                                    <Label>Plan</Label>
                                    <Select value={userSubForm.plan} onValueChange={(value) => setUserSubForm({ ...userSubForm, plan: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                        <SelectItem value="vip">VIP</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Durée (mois)</Label>
                                    <Input type="number" min="1" value={userSubForm.duration} onChange={(e) => setUserSubForm({ ...userSubForm, duration: e.target.value })} />
                                  </div>
                                  <Button onClick={handleUpdateUserSubscription}>Mettre à jour</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              size="sm" 
                              variant={user.user_roles?.some((r: any) => r.role === 'admin') ? 'destructive' : 'default'}
                              onClick={() => handleToggleAdminRole(user.id, user.user_roles?.some((r: any) => r.role === 'admin'))}
                            >
                              {user.user_roles?.some((r: any) => r.role === 'admin') ? 'Retirer Admin' : 'Rendre Admin'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de Paiement</CardTitle>
                <CardDescription>Gérer les demandes de retrait des utilisateurs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucune demande de paiement
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.profiles?.first_name} {payment.profiles?.last_name}
                            <br />
                            <span className="text-xs text-muted-foreground">{payment.profiles?.email}</span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {payment.amount} {payment.currency}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.method === 'crypto' && '₿ Crypto'}
                              {payment.method === 'mobile_money' && '📱 Mobile Money'}
                              {payment.method === 'bank_transfer' && '🏦 Virement'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                payment.status === 'approved' ? 'default' : 
                                payment.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {payment.status === 'pending' && 'En attente'}
                              {payment.status === 'approved' && 'Approuvé'}
                              {payment.status === 'rejected' && 'Rejeté'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Dialog open={isPaymentDialogOpen && selectedPayment?.id === payment.id} onOpenChange={(open) => {
                              setIsPaymentDialogOpen(open);
                              if (open) setSelectedPayment(payment);
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">Détails</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Détails du Paiement</DialogTitle>
                                  <DialogDescription>
                                    Demande de {payment.profiles?.first_name} {payment.profiles?.last_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Montant</Label>
                                      <p className="text-lg font-semibold">{payment.amount} {payment.currency}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Méthode</Label>
                                      <p className="text-lg">{payment.method}</p>
                                    </div>
                                  </div>

                                  {payment.method === 'crypto' && (
                                    <>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Adresse Crypto</Label>
                                        <p className="font-mono text-sm break-all">{payment.crypto_address}</p>
                                      </div>
                                      {payment.crypto_tx_hash && (
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Transaction Hash</Label>
                                          <p className="font-mono text-sm break-all">{payment.crypto_tx_hash}</p>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {payment.method === 'mobile_money' && (
                                    <>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Numéro Mobile</Label>
                                        <p className="text-lg">{payment.mobile_number}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-muted-foreground">Opérateur</Label>
                                        <p className="text-lg">{payment.mobile_provider}</p>
                                      </div>
                                    </>
                                  )}

                                  {payment.notes && (
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Notes</Label>
                                      <p className="text-sm">{payment.notes}</p>
                                    </div>
                                  )}

                                  {payment.proof_image_url && (
                                    <div>
                                      <Label className="text-sm text-muted-foreground mb-2 block">
                                        Capture d'écran / Preuve de paiement
                                      </Label>
                                      <div className="border rounded-lg p-2 bg-card">
                                        <img 
                                          src={payment.proof_image_url} 
                                          alt="Preuve de paiement" 
                                          className="w-full rounded object-contain max-h-96"
                                          onError={(e) => {
                                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" fill="%23666">Image non disponible</text></svg>';
                                          }}
                                        />
                                        <a 
                                          href={payment.proof_image_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                                        >
                                          Ouvrir en grand <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {payment.status === 'pending' && (
                                    <div className="flex gap-2 pt-4">
                                      <Button 
                                        onClick={() => handleApprovePayment(payment.id)}
                                        className="flex-1"
                                        variant="default"
                                      >
                                        <Check className="mr-2 h-4 w-4" />
                                        Approuver
                                      </Button>
                                      <Button 
                                        onClick={() => handleRejectPayment(payment.id)}
                                        className="flex-1"
                                        variant="destructive"
                                      >
                                        <X className="mr-2 h-4 w-4" />
                                        Rejeter
                                      </Button>
                                    </div>
                                  )}

                                  {payment.status !== 'pending' && (
                                    <div className="bg-muted p-4 rounded-lg">
                                      <p className="text-sm text-muted-foreground">
                                        Traité le {new Date(payment.processed_at).toLocaleString('fr-FR')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{editingCombo ? 'Modifier le Paris Combiné' : 'Créer un Paris Combiné'}</CardTitle>
                <CardDescription>
                  {editingCombo 
                    ? 'Modifiez les informations du combo (note: vous ne pouvez pas changer les pronos liés après création)' 
                    : 'Sélectionnez plusieurs pronos pour créer un combo'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="combo-title">Titre du Combo</Label>
                    <Input
                      id="combo-title"
                      placeholder="Ex: Triple VIP du Weekend"
                      value={comboForm.title}
                      onChange={(e) => setComboForm({ ...comboForm, title: e.target.value })}
                      data-testid="input-combo-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="combo-description">Description</Label>
                    <Textarea
                      id="combo-description"
                      placeholder="Description du combo..."
                      value={comboForm.description}
                      onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
                      data-testid="input-combo-description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="combo-odds">Cote Globale</Label>
                      <Input
                        id="combo-odds"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 5.50"
                        value={comboForm.global_odds}
                        onChange={(e) => setComboForm({ ...comboForm, global_odds: e.target.value })}
                        data-testid="input-combo-odds"
                      />
                    </div>

                    <div>
                      <Label htmlFor="combo-stake">Mise Recommandée (€)</Label>
                      <Input
                        id="combo-stake"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 10"
                        value={comboForm.stake}
                        onChange={(e) => setComboForm({ ...comboForm, stake: e.target.value })}
                        data-testid="input-combo-stake"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="combo-access-tier">Niveau d'Accès</Label>
                      <Select value={comboForm.access_tier} onValueChange={(value) => setComboForm({ ...comboForm, access_tier: value })}>
                        <SelectTrigger id="combo-access-tier" data-testid="select-combo-access-tier">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">FREE - Tous les utilisateurs</SelectItem>
                          <SelectItem value="basic">BASIC - Abonnés Basic+</SelectItem>
                          <SelectItem value="pro">PRO - Abonnés Pro+</SelectItem>
                          <SelectItem value="vip">VIP - Abonnés VIP uniquement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="combo-match-date">Date du Match</Label>
                      <Input
                        id="combo-match-date"
                        type="datetime-local"
                        value={comboForm.match_date}
                        onChange={(e) => setComboForm({ ...comboForm, match_date: e.target.value })}
                        data-testid="input-combo-match-date"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Image du Coupon (optionnel)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setComboForm({ ...comboForm, couponImage: e.target.files?.[0] || null })}
                      data-testid="input-combo-coupon-image"
                    />
                  </div>

                  {!editingCombo && (
                    <div>
                      <Label>Sélectionner les Pronos à Combiner</Label>
                      <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                        {pronos.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucun prono disponible</p>
                        ) : (
                          pronos.map((prono) => (
                            <div key={prono.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`prono-${prono.id}`}
                                checked={comboForm.selectedPronoIds.includes(prono.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setComboForm({ ...comboForm, selectedPronoIds: [...comboForm.selectedPronoIds, prono.id] });
                                  } else {
                                    setComboForm({ ...comboForm, selectedPronoIds: comboForm.selectedPronoIds.filter(id => id !== prono.id) });
                                  }
                                }}
                                data-testid={`checkbox-prono-${prono.id}`}
                              />
                              <label
                                htmlFor={`prono-${prono.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {prono.title} - {prono.home_team} vs {prono.away_team} @ {prono.odd}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {comboForm.selectedPronoIds.length} prono(s) sélectionné(s)
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={editingCombo ? handleUpdateCombo : handleCreateCombo}
                      disabled={!comboForm.title || !comboForm.global_odds || !comboForm.match_date || (!editingCombo && comboForm.selectedPronoIds.length === 0)}
                      data-testid={editingCombo ? "button-update-combo" : "button-create-combo"}
                    >
                      {editingCombo ? (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Mettre à jour
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Créer le Combo
                        </>
                      )}
                    </Button>
                    {editingCombo && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingCombo(null);
                          setComboForm({
                            title: '', description: '', global_odds: '', stake: '', 
                            access_tier: 'free', match_date: '',
                            selectedPronoIds: [], couponImage: null
                          });
                        }}
                        data-testid="button-cancel-edit-combo"
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Combos Existants</CardTitle>
                <CardDescription>Liste de tous les paris combinés</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Cote</TableHead>
                      <TableHead>Mise</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Pronos</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Aucun combo créé
                        </TableCell>
                      </TableRow>
                    ) : (
                      combos.map((combo) => (
                        <TableRow key={combo.id}>
                          <TableCell className="font-medium">{combo.title}</TableCell>
                          <TableCell>{combo.global_odds}</TableCell>
                          <TableCell>{combo.stake}€</TableCell>
                          <TableCell>
                            <Badge variant={
                              combo.access_tier === 'vip' ? 'default' :
                              combo.access_tier === 'pro' ? 'secondary' :
                              combo.access_tier === 'basic' ? 'outline' : 'secondary'
                            }>
                              {combo.access_tier.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              combo.status === 'won' ? 'default' :
                              combo.status === 'lost' ? 'destructive' : 'secondary'
                            }>
                              {combo.status === 'won' ? 'Gagné' : combo.status === 'lost' ? 'Perdu' : 'En cours'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {combo.combo_pronos?.length || 0} pronos
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Select
                                value={combo.status}
                                onValueChange={(value) => handleUpdateComboStatus(combo.id, value as 'pending' | 'won' | 'lost')}
                              >
                                <SelectTrigger className="h-8 w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">En cours</SelectItem>
                                  <SelectItem value="won">Gagné</SelectItem>
                                  <SelectItem value="lost">Perdu</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditCombo(combo)}
                                data-testid={`button-edit-combo-${combo.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteCombo(combo.id, combo.title)}
                                data-testid={`button-delete-combo-${combo.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/combos/${combo.id}`)}
                                data-testid={`button-view-combo-${combo.id}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
