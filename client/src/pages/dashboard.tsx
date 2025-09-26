import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MetricCard from "@/components/ui/metric-card";
import ProgressBar from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, UsersRound, TrendingUp, Plus, Download, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Lightbulb, UserPlus, ChartBar as BarChart3, BookOpen, Calendar } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/exports";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    enabled: isAuthenticated,
  });

  const { data: groups } = useQuery({
    queryKey: ["/api/training-groups"],
    enabled: isAuthenticated,
  });

  const { data: trainers } = useQuery({
    queryKey: ["/api/trainers"],
    enabled: isAuthenticated,
  });

  const { data: modules } = useQuery({
    queryKey: ["/api/modules"],
    enabled: isAuthenticated,
  });

  const { data: rooms } = useQuery({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated,
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/group-module-schedules"],
    enabled: isAuthenticated,
  });

  const { data: capacityAnalysis } = useQuery({
    queryKey: ["/api/capacity/analysis"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!summary) return;
    
    try {
      const reportData = {
        ...summary,
        trainers,
        modules,
        rooms,
        groups,
        schedules,
        capacityAnalysis,
        reportType: 'dashboard-summary',
        period: 'current',
        generatedAt: new Date().toISOString(),
      };

      if (format === 'excel') {
        await exportToExcel(reportData);
        toast({
          title: "Export réussi",
          description: "Le rapport Excel a été généré avec succès",
        });
      } else {
        await exportToPDF(reportData);
        toast({
          title: "Export réussi", 
          description: "Le rapport PDF a été généré avec succès",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le rapport",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">En cours</Badge>;
      case 'delayed':
        return <Badge className="bg-amber-100 text-amber-800">Retard</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Terminé</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Planifié</Badge>;
    }
  };

  const getRoomName = (roomId?: string | null) => {
    if (!roomId) return "Non assigné";
    const room = rooms?.find(r => r.id === roomId);
    return room?.name || "Salle inconnue";
  };

  // Calculs en temps réel basés sur les vraies données
  const activeGroups = groups?.filter(g => g.status === 'active').length || 0;
  const totalGroups = groups?.length || 0;
  const completedGroups = groups?.filter(g => g.status === 'completed').length || 0;
  const delayedGroups = groups?.filter(g => g.status === 'delayed').length || 0;
  const plannedGroups = groups?.filter(g => g.status === 'planned').length || 0;

  // Calculs de capacité basés sur les vraies données
  const totalTrainers = trainers?.length || 0;
  const totalRooms = rooms?.length || 0;
  const totalModules = modules?.length || 0;
  const totalSchedules = schedules?.length || 0;

  // Calculs d'occupation réels
  const trainerOccupationRate = summary?.trainerOccupationRate || 0;
  const roomOccupationRate = summary?.roomOccupationRate || 0;
  const capacityRemaining = Math.max(0, 100 - Math.max(trainerOccupationRate, roomOccupationRate));

  // Détection des problèmes
  const overloadedTrainers = summary?.trainerWorkload?.filter(t => t.occupationRate > 100).length || 0;
  const unassignedGroups = groups?.filter(g => !g.roomId).length || 0;
  const groupsWithoutSchedules = groups?.filter(g => 
    !schedules?.some(s => s.groupId === g.id)
  ).length || 0;

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="text-center">Chargement...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-page-title">
                Tableau de Bord
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Vue d'ensemble de la capacité formation en temps réel
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation("/groups")}
                data-testid="button-new-group"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Groupe
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExport('excel')}
                data-testid="button-export"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics - Données Réelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Occupation Formateurs"
              value={`${trainerOccupationRate}%`}
              subtitle={`${overloadedTrainers} en surcharge`}
              icon={Users}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
              progress={trainerOccupationRate}
              progressColor={trainerOccupationRate > 80 ? "bg-red-500" : trainerOccupationRate > 60 ? "bg-amber-500" : "bg-green-500"}
            />
            
            <MetricCard
              title="Occupation Salles"
              value={`${roomOccupationRate}%`}
              subtitle={`${totalRooms} salles disponibles`}
              icon={Building}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              progress={roomOccupationRate}
              progressColor={roomOccupationRate > 80 ? "bg-red-500" : roomOccupationRate > 60 ? "bg-amber-500" : "bg-green-500"}
            />
            
            <MetricCard
              title="Groupes Actifs"
              value={`${activeGroups}/${totalGroups}`}
              subtitle={`${plannedGroups} planifiés, ${delayedGroups} en retard`}
              icon={UsersRound}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              progress={totalGroups ? (activeGroups / totalGroups) * 100 : 0}
              progressColor="bg-blue-600"
            />
            
            <MetricCard
              title="Capacité Restante"
              value={`${capacityRemaining}%`}
              subtitle={`${Math.floor(capacityRemaining / 20)} nouveaux groupes possibles`}
              icon={TrendingUp}
              iconColor="text-amber-600"
              iconBgColor="bg-amber-100"
              progress={capacityRemaining}
              progressColor="bg-amber-600"
            />
          </div>

          {/* Statistiques Détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-sm border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Formateurs</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-total-trainers">
                      {totalTrainers}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trainers?.filter(t => t.isActive).length} actifs
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Modules</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-total-modules">
                      {totalModules}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {modules?.filter(m => m.isActive).length} actifs
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Salles</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-total-rooms">
                      {totalRooms}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rooms?.filter(r => r.type === 'classroom').length} salles, {rooms?.filter(r => r.type === 'workshop').length} ateliers
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="text-green-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Affectations</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-total-schedules">
                      {totalSchedules}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      modules assignés
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertes et Problèmes Détectés */}
          {(overloadedTrainers > 0 || unassignedGroups > 0 || groupsWithoutSchedules > 0) && (
            <Card className="shadow-sm border border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center text-amber-800">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Problèmes Détectés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {overloadedTrainers > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800">Formateurs en Surcharge</p>
                      <p className="text-sm text-red-600">{overloadedTrainers} formateur(s) dépassent leur quota</p>
                    </div>
                  )}
                  
                  {unassignedGroups > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-800">Groupes sans Salle</p>
                      <p className="text-sm text-amber-600">{unassignedGroups} groupe(s) sans salle assignée</p>
                    </div>
                  )}
                  
                  {groupsWithoutSchedules > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-800">Groupes sans Planning</p>
                      <p className="text-sm text-blue-600">{groupsWithoutSchedules} groupe(s) sans modules assignés</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts and Detailed Views */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trainer Workload */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle data-testid="text-trainer-workload-title">
                  Occupation par Formateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary?.trainerWorkload?.slice(0, 6).map((trainer, index) => {
                    const occupationColor = trainer.occupationRate > 100 
                      ? "bg-red-500" 
                      : trainer.occupationRate > 80 
                        ? "bg-amber-500" 
                        : "bg-green-500";

                    return (
                      <div key={trainer.trainerId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium" data-testid={`text-trainer-initials-${index}`}>
                              {trainer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-trainer-name-${index}`}>
                              {trainer.name}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-trainer-hours-${index}`}>
                              {trainer.currentHours}h / {trainer.maxHours}h
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium" data-testid={`text-trainer-rate-${index}`}>
                            {trainer.occupationRate}%
                          </p>
                          <ProgressBar 
                            value={trainer.occupationRate}
                            className="w-20 mt-1"
                            barClassName={occupationColor}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!summary?.trainerWorkload || summary.trainerWorkload.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Aucune charge de travail calculée</p>
                      <p className="text-xs">Créez des groupes pour voir les affectations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Room Occupancy */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle data-testid="text-room-occupancy-title">
                  Occupation des Salles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary?.roomOccupancy?.slice(0, 6).map((room, index) => {
                    const occupationColor = room.occupationRate > 80 
                      ? "bg-red-500" 
                      : room.occupationRate > 60 
                        ? "bg-amber-500" 
                        : "bg-green-500";

                    return (
                      <div key={room.roomId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Building className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-room-name-${index}`}>
                              {room.name}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-room-hours-${index}`}>
                              {room.occupiedHours}h / {room.availableHours}h
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium" data-testid={`text-room-rate-${index}`}>
                            {room.occupationRate}%
                          </p>
                          <ProgressBar 
                            value={room.occupationRate}
                            className="w-20 mt-1"
                            barClassName={occupationColor}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!summary?.roomOccupancy || summary.roomOccupancy.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Aucune occupation calculée</p>
                      <p className="text-xs">Assignez des salles aux groupes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capacity Status */}
          <Card className="shadow-sm border border-border">
            <CardHeader>
              <CardTitle data-testid="text-capacity-status-title">
                État de la Capacité Globale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {capacityRemaining > 50 ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="text-green-600 mr-3 h-5 w-5" />
                        <div>
                          <p className="font-medium text-green-800" data-testid="text-launch-possible">
                            Lancement Possible
                          </p>
                          <p className="text-sm text-green-600" data-testid="text-additional-groups">
                            {Math.floor(capacityRemaining / 20)} groupes supplémentaires peuvent être lancés
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="text-red-600 mr-3 h-5 w-5" />
                        <div>
                          <p className="font-medium text-red-800" data-testid="text-capacity-warning">
                            Capacité Limitée
                          </p>
                          <p className="text-sm text-red-600" data-testid="text-capacity-details">
                            Ressources proches de la saturation
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {overloadedTrainers > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="text-amber-600 mr-3 h-5 w-5" />
                        <div>
                          <p className="font-medium text-amber-800" data-testid="text-overload-warning">
                            Attention Surcharge
                          </p>
                          <p className="text-sm text-amber-600" data-testid="text-overload-details">
                            {overloadedTrainers} formateur(s) dépassent leur quota
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium" data-testid="text-recommendations-title">
                    Recommandations Système
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {capacityAnalysis?.recommendations?.slice(0, 4).map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <Lightbulb className="text-primary mr-2 mt-0.5 h-4 w-4" />
                        <span data-testid={`text-recommendation-${index}`}>
                          {recommendation}
                        </span>
                      </li>
                    )) || (
                      <>
                        <li className="flex items-start">
                          <Lightbulb className="text-primary mr-2 mt-0.5 h-4 w-4" />
                          <span data-testid="text-recommendation-default-1">
                            Optimiser la répartition des modules entre formateurs
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Lightbulb className="text-primary mr-2 mt-0.5 h-4 w-4" />
                          <span data-testid="text-recommendation-default-2">
                            Utiliser les salles disponibles pour nouveaux groupes
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Groups Table */}
          <Card className="shadow-sm border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle data-testid="text-active-groups-title">
                  Groupes de Formation ({totalGroups})
                </CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/groups")}
                  data-testid="button-view-all-groups"
                >
                  Voir tout →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groups && groups.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Groupe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Salle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Début
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Fin Prévue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Modules
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {groups.slice(0, 10).map((group, index) => {
                        const groupSchedules = schedules?.filter(s => s.groupId === group.id) || [];
                        const uniqueTrainers = new Set(groupSchedules.map(s => s.trainerId));
                        
                        return (
                          <tr key={group.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium" data-testid={`text-group-name-${index}`}>
                                {group.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap" data-testid={`text-group-participants-${index}`}>
                              {group.participantCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap" data-testid={`text-group-room-${index}`}>
                              {group.roomId ? getRoomName(group.roomId) : (
                                <Badge variant="outline" className="text-amber-600">Non assigné</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-group-start-${index}`}>
                              {new Date(group.startDate).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-group-end-${index}`}>
                              {group.estimatedEndDate ? new Date(group.estimatedEndDate).toLocaleDateString('fr-FR') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap" data-testid={`status-group-${index}`}>
                              {getStatusBadge(group.status)}
                              {group.delayDays && group.delayDays > 0 && (
                                <Badge variant="outline" className="ml-2 text-amber-600">
                                  +{group.delayDays}j
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap" data-testid={`modules-group-${index}`}>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-blue-600">
                                  {groupSchedules.length} modules
                                </Badge>
                                <Badge variant="outline" className="text-green-600">
                                  {uniqueTrainers.size} formateurs
                                </Badge>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">
                    Aucun groupe de formation
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Commencez par créer votre premier groupe de formation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border border-border">
            <CardHeader>
              <CardTitle data-testid="text-quick-actions-title">
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/groups")}
                  data-testid="button-create-group"
                  className="p-4 h-auto text-left justify-start flex-col items-start space-y-2"
                >
                  <Plus className="text-primary text-xl h-6 w-6" />
                  <div>
                    <div className="font-medium">Créer un nouveau groupe</div>
                    <div className="text-sm text-muted-foreground">Planifier une nouvelle formation</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setLocation("/trainers")}
                  data-testid="button-add-trainer"
                  className="p-4 h-auto text-left justify-start flex-col items-start space-y-2"
                >
                  <UserPlus className="text-green-600 text-xl h-6 w-6" />
                  <div>
                    <div className="font-medium">Ajouter un formateur</div>
                    <div className="text-sm text-muted-foreground">Étendre la capacité d'enseignement</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setLocation("/capacity")}
                  data-testid="button-analyze-capacity"
                  className="p-4 h-auto text-left justify-start flex-col items-start space-y-2"
                >
                  <BarChart3 className="text-blue-600 text-xl h-6 w-6" />
                  <div>
                    <div className="font-medium">Analyser la capacité</div>
                    <div className="text-sm text-muted-foreground">Générer un rapport détaillé</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/competency-matrix")}
                  data-testid="button-competency-matrix"
                  className="p-4 h-auto text-left justify-start flex-col items-start space-y-2"
                >
                  <Users className="text-purple-600 text-xl h-6 w-6" />
                  <div>
                    <div className="font-medium">Matrice des compétences</div>
                    <div className="text-sm text-muted-foreground">Voir les affectations formateurs-modules</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}