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
import { Loader2, Plus, Edit, Trash2, Users, TrendingUp, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
    tip: '', odd: '', confidence: '', prono_type: 'free', content: '', analysis: '', status: 'draft'
  });
  const [editingProno, setEditingProno] = useState<any>(null);
  const [isPronoDialogOpen, setIsPronoDialogOpen] = useState(false);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userSubForm, setUserSubForm] = useState({ plan: 'basic', duration: '1' });

  useEffect(() => {
    checkAdminAccess();
  }, []);

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

  useEffect(() => {
    if (isAdmin && activeTab === 'pronos') loadPronos();
    if (isAdmin && activeTab === 'users') loadUsers();
  }, [isAdmin, activeTab]);

  const handleSaveProno = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const pronoData = {
        ...pronoForm,
        odd: parseFloat(pronoForm.odd),
        confidence: parseInt(pronoForm.confidence),
        prono_type: pronoForm.prono_type as 'free' | 'basic' | 'pro' | 'vip',
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
      tip: '', odd: '', confidence: '', prono_type: 'free', content: '', analysis: '', status: 'draft'
    });
    setEditingProno(null);
  };

  const handleEditProno = (prono: any) => {
    setEditingProno(prono);
    setPronoForm({
      title: prono.title,
      sport: prono.sport,
      competition: prono.competition,
      match_time: prono.match_time?.split('T')[0] || '',
      home_team: prono.home_team,
      away_team: prono.away_team,
      tip: prono.tip,
      odd: prono.odd.toString(),
      confidence: prono.confidence.toString(),
      prono_type: prono.prono_type,
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="pronos">Pronos</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Type</Label>
                            <Select value={pronoForm.prono_type} onValueChange={(value) => setPronoForm({ ...pronoForm, prono_type: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">FREE (Gratuit)</SelectItem>
                                <SelectItem value="basic">BASIC (Abonnés Basic)</SelectItem>
                                <SelectItem value="pro">PRO (Abonnés Pro)</SelectItem>
                                <SelectItem value="vip">VIP (Abonnés VIP)</SelectItem>
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
                              prono.prono_type === 'pro' ? 'default' :
                              prono.prono_type === 'basic' ? 'secondary' :
                              'outline'
                            }
                            className={
                              prono.prono_type === 'vip' ? 'text-primary' :
                              prono.prono_type === 'pro' ? 'text-purple-400' :
                              prono.prono_type === 'basic' ? 'text-blue-400' :
                              'text-success'
                            }
                          >
                            {prono.prono_type?.toUpperCase()}
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
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
