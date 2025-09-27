import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  BarChart3,
  Building,
  BookOpen,
  TrendingUp,
  Download
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/exports";
import { useToast } from "@/hooks/use-toast";

export default function Capacity() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedView, setSelectedView] = useState("monthly");
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: capacityAnalysis, isLoading } = useQuery({
    queryKey: ["/api/capacity/analysis"],
    enabled: isAuthenticated,
  });

  const { data: summary } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    enabled: isAuthenticated,
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!capacityAnalysis || !summary) return;
    
    try {
      const reportData = {
        ...summary,
        capacityAnalysis,
        reportType: 'detailed-capacity',
        period: `${selectedYear}`,
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

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="text-center">Chargement de l'analyse de capacité...</div>
          </div>
        </main>
      </div>
    );
  }

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
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
                Calcul Charge-Capacité
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Analyse détaillée de la charge par semaine et mois
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 3 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => handleExport('excel')}
                data-testid="button-export-excel"
              >
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                data-testid="button-export-pdf"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Formateurs Actifs</p>
                    <p className="text-2xl font-bold" data-testid="text-active-trainers">
                      {capacityAnalysis?.trainerConstraints?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Salles Disponibles</p>
                    <p className="text-2xl font-bold" data-testid="text-available-rooms">
                      {capacityAnalysis?.roomConstraints?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Groupes Planifiés</p>
                    <p className="text-2xl font-bold" data-testid="text-planned-groups">
                      {capacityAnalysis?.groupAssignments?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Semaines Planifiées</p>
                    <p className="text-2xl font-bold" data-testid="text-planned-weeks">
                      {capacityAnalysis?.weeklyPlanning?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`h-5 w-5 ${
                    (capacityAnalysis?.trainerConstraints?.some(tc => tc.isOverloaded) || 
                     capacityAnalysis?.roomConstraints?.some(rc => rc.isOverbooked)) 
                    ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Conflits</p>
                    <p className={`text-2xl font-bold ${
                      (capacityAnalysis?.trainerConstraints?.some(tc => tc.isOverloaded) || 
                       capacityAnalysis?.roomConstraints?.some(rc => rc.isOverbooked)) 
                      ? 'text-red-600' : 'text-green-600'
                    }`} data-testid="text-conflicts-count">
                      {(capacityAnalysis?.trainerConstraints?.filter(tc => tc.isOverloaded).length || 0) +
                       (capacityAnalysis?.roomConstraints?.filter(rc => rc.isOverbooked).length || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monthly" data-testid="tab-monthly">Vue Mensuelle</TabsTrigger>
              <TabsTrigger value="weekly" data-testid="tab-weekly">Vue Hebdomadaire</TabsTrigger>
              <TabsTrigger value="constraints" data-testid="tab-constraints">Contraintes</TabsTrigger>
              <TabsTrigger value="assignments" data-testid="tab-assignments">Affectations</TabsTrigger>
            </TabsList>

            {/* Monthly View */}
            <TabsContent value="monthly" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Planification Mensuelle - {selectedYear}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {capacityAnalysis?.monthlyPlanning?.map((month, index) => (
                      <Card key={`${month.year}-${month.month}`} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold" data-testid={`text-month-${index}`}>
                              {month.monthName} {month.year}
                            </h4>
                            <Badge variant={month.conflicts.length > 0 ? "destructive" : "default"}>
                              {month.conflicts.length > 0 ? "Conflits" : "OK"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Groupes:</span>
                              <span className="font-medium" data-testid={`text-month-groups-${index}`}>
                                {month.totalGroups}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Heures Formateurs:</span>
                              <span className="font-medium" data-testid={`text-month-trainer-hours-${index}`}>
                                {month.totalTrainerHours}h
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Heures Salles:</span>
                              <span className="font-medium" data-testid={`text-month-room-hours-${index}`}>
                                {month.totalRoomHours}h
                              </span>
                            </div>
                          </div>
                          
                          {month.conflicts.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {month.conflicts.map((conflict, conflictIndex) => (
                                <div key={conflictIndex} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                  {conflict.description}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weekly View */}
            <TabsContent value="weekly" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Planification Hebdomadaire Détaillée</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {capacityAnalysis?.weeklyPlanning?.slice(0, 12).map((week, index) => (
                      <Card key={week.week} className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg" data-testid={`text-week-title-${index}`}>
                              Semaine {week.week}
                            </CardTitle>
                            <Badge variant="outline" data-testid={`text-week-dates-${index}`}>
                              {new Date(week.startDate).toLocaleDateString('fr-FR')} - {new Date(week.endDate).toLocaleDateString('fr-FR')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Groups and Modules */}
                            <div className="lg:col-span-2">
                              <h5 className="font-medium mb-3 flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Groupes et Modules - {week.monthName}
                              </h5>
                              <div className="space-y-3">
                                {week.groups.map((group, groupIndex) => (
                                  <div key={group.groupId} className="p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="font-medium text-blue-800" data-testid={`text-group-name-${index}-${groupIndex}`}>
                                        {group.groupName}
                                      </h6>
                                      <div className="flex items-center space-x-2">
                                        <Badge variant="outline" className="text-xs">
                                          {group.participantCount} participants
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {group.roomName}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      {group.modules
                                        .sort((a, b) => a.scheduledOrder - b.scheduledOrder)
                                        .map((module, moduleIndex) => (
                                        <div key={module.moduleId} className="flex items-center justify-between p-2 bg-white rounded border">
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              <Badge variant="outline" className="text-xs">
                                                #{module.scheduledOrder}
                                              </Badge>
                                              <p className="font-medium text-sm" data-testid={`text-module-name-${index}-${groupIndex}-${moduleIndex}`}>
                                                {module.moduleName}
                                              </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground" data-testid={`text-module-trainer-${index}-${groupIndex}-${moduleIndex}`}>
                                              {module.trainerName} - Progression: {module.progress}%
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <Badge variant={module.type === 'practical' ? 'default' : 'secondary'}>
                                              {module.type === 'practical' ? 'Pratique' : 'Théorique'}
                                            </Badge>
                                            <p className="text-sm font-medium mt-1" data-testid={`text-module-hours-${index}-${groupIndex}-${moduleIndex}`}>
                                              {module.weeklyHours}h/sem
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              sur {module.totalHours}h total
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                
                                {week.groups.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <p>Aucune formation planifiée cette semaine</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Weekly Summary */}
                            <div>
                              <h5 className="font-medium mb-3 flex items-center">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Résumé Semaine {week.week}
                              </h5>
                              
                              {/* Trainer Workload */}
                              <div className="mb-4">
                                <h6 className="text-sm font-medium mb-2">Charge Formateurs</h6>
                                <div className="space-y-2">
                                  {week.trainerWorkload.slice(0, 5).map((trainer, trainerIndex) => (
                                    <div key={trainer.trainerId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                      <span className="text-sm" data-testid={`text-trainer-week-${index}-${trainerIndex}`}>
                                        {trainer.name}
                                      </span>
                                      <Badge variant="outline" data-testid={`text-trainer-hours-${index}-${trainerIndex}`}>
                                        {trainer.weeklyHours}h
                                      </Badge>
                                    </div>
                                  ))}
                                  {week.trainerWorkload.length === 0 && (
                                    <div className="text-center py-2 text-muted-foreground text-xs">
                                      Aucun formateur assigné
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Room Occupancy */}
                              <div>
                                <h6 className="text-sm font-medium mb-2">Occupation Salles</h6>
                                <div className="space-y-2">
                                  {week.roomOccupancy.slice(0, 5).map((room, roomIndex) => (
                                    <div key={room.roomId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                      <span className="text-sm" data-testid={`text-room-week-${index}-${roomIndex}`}>
                                        {room.name}
                                      </span>
                                      <Badge variant="outline" data-testid={`text-room-hours-${index}-${roomIndex}`}>
                                        {room.occupiedHours}h
                                      </Badge>
                                    </div>
                                  ))}
                                  {week.roomOccupancy.length === 0 && (
                                    <div className="text-center py-2 text-muted-foreground text-xs">
                                      Aucune salle occupée
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Constraints View */}
            <TabsContent value="constraints" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trainer Constraints */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Contraintes Formateurs</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {capacityAnalysis?.trainerConstraints?.map((constraint, index) => (
                        <div key={constraint.trainerId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium" data-testid={`text-trainer-constraint-${index}`}>
                              {constraint.name}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-trainer-available-${index}`}>
                              {constraint.availableHours}h disponibles
                            </p>
                          </div>
                          <Badge 
                            className={constraint.isOverloaded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                            data-testid={`badge-trainer-status-${index}`}
                          >
                            {constraint.isOverloaded ? "Surcharge" : "OK"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Room Constraints */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Contraintes Salles</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {capacityAnalysis?.roomConstraints?.map((constraint, index) => (
                        <div key={constraint.roomId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium" data-testid={`text-room-constraint-${index}`}>
                              {constraint.name}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-room-type-${index}`}>
                              {constraint.type === 'workshop' ? 'Atelier' : 'Salle'} - {constraint.availableCapacity}h libres
                            </p>
                          </div>
                          <Badge 
                            className={constraint.isOverbooked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                            data-testid={`badge-room-status-${index}`}
                          >
                            {constraint.isOverbooked ? "Surbookée" : "OK"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Recommandations Système</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {capacityAnalysis?.recommendations?.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-blue-50">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-sm" data-testid={`text-recommendation-${index}`}>
                          {recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments View */}
            <TabsContent value="assignments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Affectations par Groupe</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {capacityAnalysis?.groupAssignments?.map((assignment, index) => (
                      <Card key={assignment.groupId} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold" data-testid={`text-assignment-group-${index}`}>
                              {assignment.groupName}
                            </h4>
                            <div className="flex space-x-2">
                              <Badge variant="outline" data-testid={`badge-modules-count-${index}`}>
                                {assignment.assignedModules} modules
                              </Badge>
                              <Badge variant="outline" data-testid={`badge-trainers-count-${index}`}>
                                {assignment.assignedTrainers} formateurs
                              </Badge>
                              <Badge 
                                className={assignment.hasRoom ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                data-testid={`badge-room-status-${index}`}
                              >
                                {assignment.hasRoom ? "Salle OK" : "Sans salle"}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Module details for this group */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {capacityAnalysis?.weeklyPlanning?.slice(0, 4).map((week, weekIndex) => {
                              const groupWeek = week.groups.find(g => g.groupId === assignment.groupId);
                              if (!groupWeek || groupWeek.modules.length === 0) return null;
                              
                              return (
                                <div key={week.week} className="p-3 bg-muted/30 rounded">
                                  <h6 className="font-medium text-sm mb-2">
                                    Semaine {week.week}
                                  </h6>
                                  <div className="space-y-1">
                                    {groupWeek.modules.map((module, moduleIndex) => (
                                      <div key={module.moduleId} className="text-xs flex justify-between">
                                        <span className="truncate">{module.moduleName}</span>
                                        <span className="font-medium">{module.weeklyHours}h</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Detailed Planning Matrix */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Matrice de Planification Détaillée</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[1400px]">
                  {/* Header */}
                  <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'minmax(200px, 250px) repeat(12, minmax(100px, 1fr))' }}>
                    <div className="font-semibold text-sm p-2 bg-muted rounded">Ressource / Semaine</div>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} className="font-semibold text-xs p-2 bg-muted rounded text-center">
                        Sem. {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Trainer Rows */}
                  {capacityAnalysis?.trainerConstraints?.map((trainer, trainerIndex) => (
                    <div key={trainer.trainerId} className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'minmax(200px, 250px) repeat(12, minmax(100px, 1fr))' }}>
                      <div className="p-2 border rounded font-medium text-sm bg-blue-50">
                        <div className="truncate">{trainer.name}</div>
                        <div className="text-xs text-blue-600">
                          Formateur - {trainer.availableHours}h dispo
                        </div>
                      </div>
                      {Array.from({ length: 12 }, (_, weekIndex) => {
                        const week = capacityAnalysis?.weeklyPlanning?.find(w => w.week === weekIndex + 1);
                        const trainerHours = week?.trainerWorkload.find(tw => tw.trainerId === trainer.trainerId)?.weeklyHours || 0;
                        const isOverloaded = trainerHours > (trainer.availableHours / 4); // Rough weekly limit
                        
                        return (
                          <div key={weekIndex} className={`h-12 border rounded flex items-center justify-center text-sm font-bold ${
                            isOverloaded ? 'bg-red-200 text-red-800' : 
                            trainerHours > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-50'
                          }`} data-testid={`cell-trainer-${trainerIndex}-week-${weekIndex}`}>
                            {trainerHours > 0 ? `${trainerHours}h` : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Room Rows */}
                  {capacityAnalysis?.roomConstraints?.map((room, roomIndex) => (
                    <div key={room.roomId} className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'minmax(200px, 250px) repeat(12, minmax(100px, 1fr))' }}>
                      <div className="p-2 border rounded font-medium text-sm bg-purple-50">
                        <div className="truncate">{room.name}</div>
                        <div className="text-xs text-purple-600">
                          {room.type === 'workshop' ? 'Atelier' : 'Salle'} - {room.availableCapacity}h libres
                        </div>
                      </div>
                      {Array.from({ length: 12 }, (_, weekIndex) => {
                        const week = capacityAnalysis?.weeklyPlanning?.find(w => w.week === weekIndex + 1);
                        const roomHours = week?.roomOccupancy.find(ro => ro.roomId === room.roomId)?.occupiedHours || 0;
                        const isOverbooked = roomHours > 40; // 40h per week max
                        
                        return (
                          <div key={weekIndex} className={`h-12 border rounded flex items-center justify-center text-sm font-bold ${
                            isOverbooked ? 'bg-red-200 text-red-800' : 
                            roomHours > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-50'
                          }`} data-testid={`cell-room-${roomIndex}-week-${weekIndex}`}>
                            {roomHours > 0 ? `${roomHours}h` : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Légende du Tableau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border-green-400 border rounded"></div>
                  <span className="text-sm">Charge normale</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-200 border-red-400 border rounded"></div>
                  <span className="text-sm">Surcharge détectée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border-blue-400 border rounded"></div>
                  <span className="text-sm">Formateur assigné</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-100 border-purple-400 border rounded"></div>
                  <span className="text-sm">Salle occupée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">XXh</span>
                  <span className="text-sm">= Volume horaire hebdomadaire</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Sem. X</span>
                  <span className="text-sm">= Numéro de semaine</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}