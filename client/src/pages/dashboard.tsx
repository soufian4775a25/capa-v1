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
import { 
  Users, 
  Building, 
  UsersRound, 
  TrendingUp, 
  Plus, 
  Download,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  UserPlus,
  BarChart3
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/exports";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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

  if (!isAuthenticated) {
    return null;
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!summary) return;
    
    if (format === 'excel') {
      await exportToExcel(summary);
    } else {
      await exportToPDF(summary);
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
                Vue d'ensemble de la capacité formation
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Occupation Formateurs"
              value={`${summary?.trainerOccupationRate || 0}%`}
              icon={Users}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
              progress={summary?.trainerOccupationRate || 0}
              progressColor="bg-primary"
            />
            
            <MetricCard
              title="Occupation Salles"
              value={`${summary?.roomOccupationRate || 0}%`}
              icon={Building}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              progress={summary?.roomOccupationRate || 0}
              progressColor="bg-green-600"
            />
            
            <MetricCard
              title="Groupes Actifs"
              value={`${summary?.activeGroups || 0}/${summary?.totalGroups || 0}`}
              icon={UsersRound}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              progress={summary?.totalGroups ? (summary.activeGroups / summary.totalGroups) * 100 : 0}
              progressColor="bg-blue-600"
            />
            
            <MetricCard
              title="Capacité Restante"
              value={`${summary?.capacityRemaining || 0}%`}
              icon={TrendingUp}
              iconColor="text-amber-600"
              iconBgColor="bg-amber-100"
              progress={summary?.capacityRemaining || 0}
              progressColor="bg-amber-600"
            />
          </div>

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
                  {summary?.trainerWorkload?.slice(0, 5).map((trainer, index) => {
                    const occupationColor = trainer.occupationRate > 80 
                      ? "bg-red-500" 
                      : trainer.occupationRate > 60 
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
                </div>
              </CardContent>
            </Card>

            {/* Capacity Status */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle data-testid="text-capacity-status-title">
                  État de la Capacité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-600 mr-3 h-5 w-5" />
                      <div>
                        <p className="font-medium text-green-800" data-testid="text-launch-possible">
                          Lancement Possible
                        </p>
                        <p className="text-sm text-green-600" data-testid="text-additional-groups">
                          {Math.floor((summary?.capacityRemaining || 0) / 10)} groupes supplémentaires peuvent être lancés
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {(summary?.trainerWorkload?.some(t => t.occupationRate > 80)) && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="text-amber-600 mr-3 h-5 w-5" />
                        <div>
                          <p className="font-medium text-amber-800" data-testid="text-overload-warning">
                            Attention Surcharge
                          </p>
                          <p className="text-sm text-amber-600" data-testid="text-overload-details">
                            Certains formateurs dépassent leur quota
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium" data-testid="text-recommendations-title">
                      Recommandations
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <Lightbulb className="text-primary mr-2 mt-0.5 h-4 w-4" />
                        <span data-testid="text-recommendation-1">
                          Optimiser la répartition des modules entre formateurs
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Lightbulb className="text-primary mr-2 mt-0.5 h-4 w-4" />
                        <span data-testid="text-recommendation-2">
                          Utiliser les salles disponibles pour nouveaux groupes
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Lightbulb className="text-primary mr-2 mt-0.5 h-4 w-4" />
                        <span data-testid="text-recommendation-3">
                          Considérer l'embauche de formateurs supplémentaires
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Groups Table */}
          <Card className="shadow-sm border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle data-testid="text-active-groups-title">
                  Groupes de Formation Actifs
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groups?.slice(0, 10).map((group, index) => (
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
                          {group.roomId ? "Salle assignée" : "Non assigné"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-group-start-${index}`}>
                          {new Date(group.startDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-group-end-${index}`}>
                          {group.estimatedEndDate ? new Date(group.estimatedEndDate).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" data-testid={`status-group-${index}`}>
                          {getStatusBadge(group.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
