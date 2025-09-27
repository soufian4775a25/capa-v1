import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModuleForm from "@/components/forms/module-form";
import { Plus, CreditCard as Edit, Trash2, BookOpen, Clock, Users, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Module, ModuleTrainerAssignment } from "@shared/schema";

export default function Modules() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: modules, isLoading } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
    enabled: isAuthenticated,
  });

  const { data: assignments } = useQuery<ModuleTrainerAssignment[]>({
    queryKey: ["/api/module-trainer-assignments"],
    enabled: isAuthenticated,
  });

  const { data: trainers } = useQuery({
    queryKey: ["/api/trainers"],
    enabled: isAuthenticated,
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/group-module-schedules"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({
        title: "Succès",
        description: "Module supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le module",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingModule(null);
  };

  const getModuleStats = (moduleId: string) => {
    const moduleAssignments = assignments?.filter(a => a.moduleId === moduleId && a.canTeach) || [];
    const moduleSchedules = schedules?.filter(s => s.moduleId === moduleId) || [];
    
    return {
      availableTrainers: moduleAssignments.length,
      activeAssignments: moduleSchedules.length,
      totalTrainers: trainers?.length || 0
    };
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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-page-title">
                Modules de Formation
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Gérer les modules et programmes de formation
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              data-testid="button-add-module"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Module
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-form-title">
                  {editingModule ? "Modifier le module" : "Nouveau module"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ModuleForm 
                  module={editingModule} 
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingModule(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Module Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Modules</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-total-modules">
                      {modules?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Modules Théoriques</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-theoretical-modules">
                      {modules?.filter(m => m.type === 'theoretical').length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-green-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Modules Pratiques</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-practical-modules">
                      {modules?.filter(m => m.type === 'practical').length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Volume Total</p>
                    <p className="text-2xl font-bold text-amber-600" data-testid="text-total-hours">
                      {modules?.reduce((sum, m) => sum + m.totalHours, 0) || 0}h
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-amber-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules?.map((module) => {
              const stats = getModuleStats(module.id);
              
              return (
                <Card key={module.id} className="shadow-sm border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          module.type === 'practical' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          <BookOpen className={`h-6 w-6 ${
                            module.type === 'practical' ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate" data-testid={`text-module-name-${module.id}`}>
                            {module.name}
                          </CardTitle>
                          <Badge 
                            variant={module.type === 'practical' ? 'default' : 'secondary'}
                            data-testid={`badge-module-type-${module.id}`}
                          >
                            {module.type === 'practical' ? 'Pratique' : 'Théorique'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(module)}
                          data-testid={`button-edit-module-${module.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(module.id)}
                          data-testid={`button-delete-module-${module.id}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {module.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-module-description-${module.id}`}>
                          {module.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Durée totale</span>
                        </div>
                        <span className="font-medium" data-testid={`text-module-duration-${module.id}`}>
                          {module.totalHours}h
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Séances/semaine</span>
                        <span className="font-medium" data-testid={`text-module-sessions-${module.id}`}>
                          {module.sessionsPerWeek}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Heures/séance</span>
                        <span className="font-medium" data-testid={`text-module-hours-session-${module.id}`}>
                          {module.hoursPerSession}h
                        </span>
                      </div>

                      {/* Trainer Assignment Info */}
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Formateurs</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-blue-600" data-testid={`badge-available-trainers-${module.id}`}>
                              {stats.availableTrainers} disponibles
                            </Badge>
                            {stats.activeAssignments > 0 && (
                              <Badge className="bg-green-100 text-green-800" data-testid={`badge-active-trainers-${module.id}`}>
                                {stats.activeAssignments} actifs
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {stats.availableTrainers === 0 && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            ⚠️ Aucun formateur qualifié pour ce module
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Durée estimée</span>
                          <span className="font-medium" data-testid={`text-module-estimated-duration-${module.id}`}>
                            {Math.ceil(module.totalHours / (module.sessionsPerWeek * Number(module.hoursPerSession)))} semaines
                          </span>
                        </div>
                      </div>
                      
                      {module.isActive ? (
                        <Badge className="bg-green-100 text-green-800" data-testid={`status-module-active-${module.id}`}>
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`status-module-inactive-${module.id}`}>
                          Inactif
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {modules?.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground" data-testid="text-no-modules">
                Aucun module
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par créer votre premier module de formation.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setShowForm(true)}
                  data-testid="button-add-first-module"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un module
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}