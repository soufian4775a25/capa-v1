import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, BookOpen, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Download, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToExcel } from "@/lib/exports";
import type { Trainer, Module, ModuleTrainerAssignment } from "@shared/schema";

export default function CompetencyMatrix() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedView, setSelectedView] = useState<"matrix" | "assignments">("matrix");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: trainers, isLoading: trainersLoading } = useQuery<Trainer[]>({
    queryKey: ["/api/trainers"],
    enabled: isAuthenticated,
  });

  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
    enabled: isAuthenticated,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<ModuleTrainerAssignment[]>({
    queryKey: ["/api/module-trainer-assignments"],
    enabled: isAuthenticated,
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/group-module-schedules"],
    enabled: isAuthenticated,
  });

  const autoAssignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auto-assign/trainers-modules");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/module-trainer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({
        title: "Succès",
        description: "Affectations automatiques créées avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer les affectations automatiques",
        variant: "destructive",
      });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { moduleId: string; trainerId: string; canTeach: boolean }) => {
      return await apiRequest("POST", "/api/module-trainer-assignments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/module-trainer-assignments"] });
      toast({
        title: "Succès",
        description: "Affectation mise à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'affectation",
        variant: "destructive",
      });
    },
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!trainers || !modules || !assignments) return;
    
    try {
      const reportData = {
        trainers,
        modules,
        assignments,
        schedules,
        reportType: 'competency-matrix',
        period: 'current',
        generatedAt: new Date().toISOString(),
      };

      if (format === 'excel') {
        await exportToExcel(reportData);
        toast({
          title: "Export réussi",
          description: "La matrice des compétences Excel a été générée",
        });
      } else {
        await exportToPDF(reportData);
        toast({
          title: "Export réussi", 
          description: "La matrice des compétences PDF a été générée",
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

  const toggleAssignment = (moduleId: string, trainerId: string, currentCanTeach: boolean) => {
    createAssignmentMutation.mutate({
      moduleId,
      trainerId,
      canTeach: !currentCanTeach
    });
  };

  const getAssignment = (moduleId: string, trainerId: string) => {
    return assignments?.find(a => a.moduleId === moduleId && a.trainerId === trainerId);
  };

  const canTrainerTeachModule = (trainer: Trainer, module: Module) => {
    const assignment = getAssignment(module.id, trainer.id);
    if (assignment) return assignment.canTeach;
    
    // Auto-detect based on specialties
    return trainer.specialties?.some(specialty => 
      module.name.toLowerCase().includes(specialty.toLowerCase()) ||
      specialty.toLowerCase().includes(module.name.toLowerCase()) ||
      (module.type === 'practical' && specialty.toLowerCase().includes('pratique')) ||
      (module.type === 'theoretical' && specialty.toLowerCase().includes('théorique'))
    ) || false;
  };

  const getTrainerModuleStats = (trainerId: string) => {
    const trainerAssignments = assignments?.filter(a => a.trainerId === trainerId && a.canTeach) || [];
    const trainerSchedules = schedules?.filter(s => s.trainerId === trainerId) || [];
    
    return {
      canTeachModules: trainerAssignments.length,
      activeAssignments: trainerSchedules.length,
      totalModules: modules?.length || 0
    };
  };

  const getModuleTrainerStats = (moduleId: string) => {
    const moduleAssignments = assignments?.filter(a => a.moduleId === moduleId && a.canTeach) || [];
    const moduleSchedules = schedules?.filter(s => s.moduleId === moduleId) || [];
    
    return {
      availableTrainers: moduleAssignments.length,
      activeTrainers: moduleSchedules.length,
      totalTrainers: trainers?.length || 0
    };
  };

  if (!isAuthenticated) {
    return null;
  }

  if (trainersLoading || modulesLoading || assignmentsLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="text-center">Chargement de la matrice des compétences...</div>
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
                Matrice des Compétences
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Gestion des compétences d'animation par formateur et module
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => autoAssignMutation.mutate()}
                disabled={autoAssignMutation.isPending}
                data-testid="button-auto-assign"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {autoAssignMutation.isPending ? "Affectation..." : "Affectation Auto"}
              </Button>
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

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Affectations</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-total-assignments">
                      {assignments?.filter(a => a.canTeach).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Affectations Actives</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-active-assignments">
                      {schedules?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="text-green-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Taux de Couverture</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-coverage-rate">
                      {trainers && modules ? 
                        Math.round(((assignments?.filter(a => a.canTeach).length || 0) / (trainers.length * modules.length)) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Modules Sans Formateur</p>
                    <p className="text-2xl font-bold text-amber-600" data-testid="text-uncovered-modules">
                      {modules?.filter(module => 
                        !assignments?.some(a => a.moduleId === module.id && a.canTeach)
                      ).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-amber-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-4">
            <Button
              variant={selectedView === "matrix" ? "default" : "outline"}
              onClick={() => setSelectedView("matrix")}
              data-testid="button-view-matrix"
            >
              Matrice Complète
            </Button>
            <Button
              variant={selectedView === "assignments" ? "default" : "outline"}
              onClick={() => setSelectedView("assignments")}
              data-testid="button-view-assignments"
            >
              Affectations Détaillées
            </Button>
          </div>

          {selectedView === "matrix" ? (
            /* Competency Matrix */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Matrice Formateurs × Modules</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'minmax(200px, 250px) repeat(auto-fit, minmax(120px, 1fr))' }}>
                      <div className="font-semibold text-sm p-3 bg-muted rounded">Formateur / Module</div>
                      {modules?.map((module, index) => (
                        <div key={module.id} className="font-semibold text-xs p-2 bg-muted rounded text-center">
                          <div className="truncate" data-testid={`header-module-${index}`}>
                            {module.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {module.totalHours}h - {module.type === 'practical' ? 'Pratique' : 'Théorique'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Trainer Rows */}
                    {trainers?.map((trainer, trainerIndex) => {
                      const stats = getTrainerModuleStats(trainer.id);
                      
                      return (
                        <div key={trainer.id} className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'minmax(200px, 250px) repeat(auto-fit, minmax(120px, 1fr))' }}>
                          <div className="p-3 border rounded font-medium text-sm bg-blue-50">
                            <div className="truncate font-semibold" data-testid={`trainer-name-${trainerIndex}`}>
                              {trainer.name}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {stats.canTeachModules}/{stats.totalModules} modules
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trainer.maxHoursPerWeek}h/sem max
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {trainer.specialties?.slice(0, 2).map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {modules?.map((module, moduleIndex) => {
                            const canTeach = canTrainerTeachModule(trainer, module);
                            const assignment = getAssignment(module.id, trainer.id);
                            const isActive = schedules?.some(s => s.moduleId === module.id && s.trainerId === trainer.id);
                            
                            return (
                              <div key={module.id} className={`h-20 border rounded flex flex-col items-center justify-center text-sm ${
                                isActive ? 'bg-green-200 border-green-400' :
                                canTeach ? 'bg-green-100 border-green-300' : 
                                'bg-gray-50 border-gray-200'
                              }`}>
                                <Checkbox
                                  checked={canTeach}
                                  onCheckedChange={() => toggleAssignment(module.id, trainer.id, canTeach)}
                                  data-testid={`checkbox-${trainerIndex}-${moduleIndex}`}
                                  className="mb-1"
                                />
                                {isActive && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    Actif
                                  </Badge>
                                )}
                                {canTeach && !isActive && (
                                  <span className="text-xs text-green-700 font-medium">
                                    Peut enseigner
                                  </span>
                                )}
                                {!canTeach && (
                                  <span className="text-xs text-gray-500">
                                    Non qualifié
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Detailed Assignments View */
            <div className="space-y-6">
              {/* Trainer Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trainers?.map((trainer, index) => {
                  const stats = getTrainerModuleStats(trainer.id);
                  const trainerAssignments = assignments?.filter(a => a.trainerId === trainer.id && a.canTeach) || [];
                  const trainerSchedules = schedules?.filter(s => s.trainerId === trainer.id) || [];
                  
                  return (
                    <Card key={trainer.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg" data-testid={`trainer-detail-name-${index}`}>
                                {trainer.name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {trainer.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={stats.activeAssignments > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {stats.activeAssignments > 0 ? "Actif" : "Disponible"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Specialties */}
                          <div>
                            <p className="text-sm font-medium mb-2">Spécialités</p>
                            <div className="flex flex-wrap gap-1">
                              {trainer.specialties?.map((specialty, specIndex) => (
                                <Badge key={specIndex} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Module Assignments */}
                          <div>
                            <p className="text-sm font-medium mb-2">Modules Assignés ({stats.canTeachModules})</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {trainerAssignments.map((assignment, assignIndex) => {
                                const module = modules?.find(m => m.id === assignment.moduleId);
                                const isActive = trainerSchedules.some(s => s.moduleId === assignment.moduleId);
                                
                                return module ? (
                                  <div key={assignment.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                    <div>
                                      <p className="text-sm font-medium" data-testid={`assigned-module-${index}-${assignIndex}`}>
                                        {module.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {module.totalHours}h - {module.type === 'practical' ? 'Pratique' : 'Théorique'}
                                      </p>
                                    </div>
                                    <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                      {isActive ? "En cours" : "Disponible"}
                                    </Badge>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>

                          {/* Workload */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Charge actuelle:</span>
                              <p className="font-medium">{trainer.currentHoursPerWeek}h / {trainer.maxHoursPerWeek}h</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Occupation:</span>
                              <p className="font-medium">
                                {Math.round((trainer.currentHoursPerWeek / trainer.maxHoursPerWeek) * 100)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Module Coverage Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Couverture par Module</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modules?.map((module, index) => {
                      const stats = getModuleTrainerStats(module.id);
                      const moduleAssignments = assignments?.filter(a => a.moduleId === module.id && a.canTeach) || [];
                      
                      return (
                        <div key={module.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold" data-testid={`module-coverage-name-${index}`}>
                                {module.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {module.totalHours}h - {module.sessionsPerWeek} séances/sem - {module.type === 'practical' ? 'Pratique' : 'Théorique'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={stats.availableTrainers > 0 ? "default" : "destructive"}>
                                {stats.availableTrainers} formateur{stats.availableTrainers > 1 ? 's' : ''}
                              </Badge>
                              {stats.activeTrainers > 0 && (
                                <Badge className="bg-green-100 text-green-800">
                                  {stats.activeTrainers} actif{stats.activeTrainers > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {moduleAssignments.map((assignment, assignIndex) => {
                              const trainer = trainers?.find(t => t.id === assignment.trainerId);
                              const isActive = schedules?.some(s => s.moduleId === module.id && s.trainerId === assignment.trainerId);
                              
                              return trainer ? (
                                <div key={assignment.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                  <div>
                                    <p className="text-sm font-medium" data-testid={`module-trainer-${index}-${assignIndex}`}>
                                      {trainer.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {trainer.currentHoursPerWeek}h / {trainer.maxHoursPerWeek}h
                                    </p>
                                  </div>
                                  <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                    {isActive ? "Assigné" : "Disponible"}
                                  </Badge>
                                </div>
                              ) : null;
                            })}
                          </div>
                          
                          {moduleAssignments.length === 0 && (
                            <div className="text-center py-4 text-amber-600 bg-amber-50 rounded">
                              <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
                              <p className="text-sm font-medium">Aucun formateur qualifié</p>
                              <p className="text-xs">Vérifiez les spécialités des formateurs</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Légende</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-200 border-green-400 border rounded"></div>
                  <span className="text-sm">Affectation active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border-green-300 border rounded"></div>
                  <span className="text-sm">Peut enseigner</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-50 border-gray-200 border rounded"></div>
                  <span className="text-sm">Non qualifié</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Formateur disponible</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}