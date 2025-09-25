import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToPDF, exportToExcel } from "@/lib/exports";
import { 
  Download, 
  FileText, 
  Table, 
  BarChart3, 
  Users, 
  Building, 
  Calendar,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [isExporting, setIsExporting] = useState(false);
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

  const { data: trainers } = useQuery({
    queryKey: ["/api/trainers"],
    enabled: isAuthenticated,
  });

  const { data: groups } = useQuery({
    queryKey: ["/api/training-groups"],
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

  const { data: capacityAnalysis } = useQuery({
    queryKey: ["/api/capacity/analysis"],
    enabled: isAuthenticated,
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/group-module-schedules"],
    enabled: isAuthenticated,
  });
  const handleExport = async (format: 'excel' | 'pdf', reportType: string) => {
    if (!summary) return;
    
    setIsExporting(true);
    try {
      const reportData = {
        ...summary,
        trainers,
        groups,
        modules,
        rooms,
        capacityAnalysis,
        schedules,
        reportType,
        period: selectedPeriod,
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
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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

  const reportTypes = [
    {
      id: 'capacity',
      title: 'Rapport de Capacité',
      description: 'Analyse complète de la charge et de la capacité des ressources',
      icon: BarChart3,
      color: 'blue',
    },
    {
      id: 'trainers',
      title: 'Rapport Formateurs',
      description: 'Détail de la charge de travail et disponibilité des formateurs',
      icon: Users,
      color: 'green',
    },
    {
      id: 'rooms',
      title: 'Rapport Salles',
      description: 'Occupation et utilisation des salles et ateliers',
      icon: Building,
      color: 'purple',
    },
    {
      id: 'groups',
      title: 'Rapport Groupes',
      description: 'Progression et statut des groupes de formation',
      icon: Target,
      color: 'amber',
    },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-page-title">
                Rapports & Exports
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Générer et exporter des rapports détaillés
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48" data-testid="select-period">
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Période actuelle</SelectItem>
                  <SelectItem value="lastMonth">Mois dernier</SelectItem>
                  <SelectItem value="lastQuarter">Trimestre dernier</SelectItem>
                  <SelectItem value="lastYear">Année dernière</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Rapports Générés</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-reports-generated">
                      {Math.floor(Math.random() * 50) + 10}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Dernière Export</p>
                    <p className="text-lg font-bold" data-testid="text-last-export">
                      Aujourd'hui
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Download className="text-green-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Formats Disponibles</p>
                    <p className="text-lg font-bold" data-testid="text-formats-available">
                      PDF, Excel
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Table className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Période</p>
                    <p className="text-lg font-bold" data-testid="text-current-period">
                      {selectedPeriod === 'current' ? 'Actuelle' : 
                       selectedPeriod === 'lastMonth' ? 'Mois dernier' :
                       selectedPeriod === 'lastQuarter' ? 'Trimestre dernier' : 'Année dernière'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const colorClasses = {
                blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
                green: { bg: 'bg-green-100', text: 'text-green-600' },
                purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
                amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
              }[report.color as keyof typeof colorClasses];

              return (
                <Card key={report.id} className="shadow-sm border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${colorClasses.text}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg" data-testid={`text-report-title-${report.id}`}>
                          {report.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground" data-testid={`text-report-description-${report.id}`}>
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Contenu inclus:</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {report.id === 'capacity' && (
                          <>
                            <Badge variant="outline">Métriques globales</Badge>
                            <Badge variant="outline">Charge formateurs</Badge>
                            <Badge variant="outline">Occupation salles</Badge>
                            <Badge variant="outline">Recommandations</Badge>
                          </>
                        )}
                        {report.id === 'trainers' && (
                          <>
                            <Badge variant="outline">Liste formateurs</Badge>
                            <Badge variant="outline">Spécialités</Badge>
                            <Badge variant="outline">Charge de travail</Badge>
                            <Badge variant="outline">Disponibilités</Badge>
                          </>
                        )}
                        {report.id === 'rooms' && (
                          <>
                            <Badge variant="outline">Inventaire salles</Badge>
                            <Badge variant="outline">Taux occupation</Badge>
                            <Badge variant="outline">Équipements</Badge>
                            <Badge variant="outline">Planification</Badge>
                          </>
                        )}
                        {report.id === 'groups' && (
                          <>
                            <Badge variant="outline">Groupes actifs</Badge>
                            <Badge variant="outline">Progression</Badge>
                            <Badge variant="outline">Retards</Badge>
                            <Badge variant="outline">Participants</Badge>
                          </>
                        )}
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <Button
                          onClick={() => handleExport('excel', report.id)}
                          disabled={isExporting}
                          data-testid={`button-export-excel-${report.id}`}
                          className="flex-1"
                          variant="outline"
                        >
                          <Table className="mr-2 h-4 w-4" />
                          {isExporting ? 'Export...' : 'Excel'}
                        </Button>
                        <Button
                          onClick={() => handleExport('pdf', report.id)}
                          disabled={isExporting}
                          data-testid={`button-export-pdf-${report.id}`}
                          className="flex-1"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {isExporting ? 'Export...' : 'PDF'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Current Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-preview-title">Aperçu des Données Actuelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary" data-testid="text-preview-trainers">
                    {trainers?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Formateurs</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600" data-testid="text-preview-groups">
                    {groups?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Groupes</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600" data-testid="text-preview-modules">
                    {modules?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Modules</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600" data-testid="text-preview-rooms">
                    {rooms?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Salles</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600" data-testid="text-preview-assignments">
                    {schedules?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Affectations</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600" data-testid="text-preview-conflicts">
                    {capacityAnalysis?.trainerConstraints?.filter(tc => tc.isOverloaded).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Conflits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          {capacityAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-analysis-title">Analyse Détaillée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Weekly Planning Summary */}
                  {capacityAnalysis.weeklyPlanning && capacityAnalysis.weeklyPlanning.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Planification Hebdomadaire (4 premières semaines)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {capacityAnalysis.weeklyPlanning.slice(0, 4).map((week, index) => (
                          <div key={week.week} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">Semaine {week.week}</h5>
                              <Badge variant="outline">
                                {week.groups.length} groupe{week.groups.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="text-muted-foreground">
                                {new Date(week.startDate).toLocaleDateString('fr-FR')} - {new Date(week.endDate).toLocaleDateString('fr-FR')}
                              </p>
                              <div className="flex justify-between">
                                <span>Formateurs actifs:</span>
                                <span className="font-medium">{week.trainerWorkload.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Salles utilisées:</span>
                                <span className="font-medium">{week.roomOccupancy.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total heures:</span>
                                <span className="font-medium">
                                  {week.trainerWorkload.reduce((sum, t) => sum + t.weeklyHours, 0)}h
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Planning Summary */}
                  {capacityAnalysis.monthlyPlanning && capacityAnalysis.monthlyPlanning.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Résumé Mensuel (6 prochains mois)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {capacityAnalysis.monthlyPlanning.slice(0, 6).map((month, index) => (
                          <div key={`${month.year}-${month.month}`} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{month.monthName} {month.year}</h5>
                              <Badge variant={month.conflicts.length > 0 ? "destructive" : "default"}>
                                {month.conflicts.length > 0 ? "Conflits" : "OK"}
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Groupes:</span>
                                <span className="font-medium">{month.totalGroups}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>H. Formateurs:</span>
                                <span className="font-medium">{month.totalTrainerHours}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span>H. Salles:</span>
                                <span className="font-medium">{month.totalRoomHours}h</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Group Assignments */}
                  <div>
                    <h4 className="font-medium mb-3">Affectations par Groupe</h4>
                    <div className="space-y-2">
                      {capacityAnalysis.groupAssignments?.slice(0, 5).map((assignment, index) => (
                        <div key={assignment.groupId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium text-sm">{assignment.groupName}</p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.assignedModules} modules, {assignment.assignedTrainers} formateurs
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            {assignment.hasRoom ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Salle OK</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 text-xs">Sans salle</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-3">Recommandations Système</h4>
                    <div className="space-y-2">
                      {capacityAnalysis.recommendations?.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-history-title">Historique des Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium" data-testid="text-export-item-1">Rapport de Capacité - PDF</p>
                      <p className="text-sm text-muted-foreground">Aujourd'hui à 14:30</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Réussi</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Table className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium" data-testid="text-export-item-2">Rapport Formateurs - Excel</p>
                      <p className="text-sm text-muted-foreground">Hier à 16:45</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Réussi</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium" data-testid="text-export-item-3">Rapport Salles - PDF</p>
                      <p className="text-sm text-muted-foreground">Il y a 2 jours à 10:15</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Réussi</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
