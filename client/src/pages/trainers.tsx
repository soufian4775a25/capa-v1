import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrainerForm from "@/components/forms/trainer-form";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trainer } from "@shared/schema";

export default function Trainers() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: trainers, isLoading } = useQuery({
    queryKey: ["/api/trainers"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/trainers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
      toast({
        title: "Succès",
        description: "Formateur supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le formateur",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce formateur ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTrainer(null);
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
                Formateurs
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Gérer les formateurs et leurs spécialités
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              data-testid="button-add-trainer"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Formateur
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-form-title">
                  {editingTrainer ? "Modifier le formateur" : "Nouveau formateur"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrainerForm 
                  trainer={editingTrainer} 
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingTrainer(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Trainers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers?.map((trainer) => (
              <Card key={trainer.id} className="shadow-sm border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-trainer-name-${trainer.id}`}>
                          {trainer.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground" data-testid={`text-trainer-email-${trainer.id}`}>
                          {trainer.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(trainer)}
                        data-testid={`button-edit-trainer-${trainer.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(trainer.id)}
                        data-testid={`button-delete-trainer-${trainer.id}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Spécialités</p>
                      <div className="flex flex-wrap gap-2">
                        {trainer.specialties?.map((specialty, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            data-testid={`badge-specialty-${trainer.id}-${index}`}
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Heures max/semaine</span>
                      <span className="font-medium" data-testid={`text-trainer-hours-${trainer.id}`}>
                        {trainer.maxHoursPerWeek}h
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Heures actuelles</span>
                      <span className="font-medium" data-testid={`text-trainer-current-hours-${trainer.id}`}>
                        {trainer.currentHoursPerWeek}h
                      </span>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min((trainer.currentHoursPerWeek / trainer.maxHoursPerWeek) * 100, 100)}%` 
                        }}
                        data-testid={`progress-trainer-workload-${trainer.id}`}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Occupation</span>
                      <span 
                        className="font-medium"
                        data-testid={`text-trainer-occupation-${trainer.id}`}
                      >
                        {Math.round((trainer.currentHoursPerWeek / trainer.maxHoursPerWeek) * 100)}%
                      </span>
                    </div>
                    
                    {trainer.isActive ? (
                      <Badge className="bg-green-100 text-green-800" data-testid={`status-trainer-active-${trainer.id}`}>
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" data-testid={`status-trainer-inactive-${trainer.id}`}>
                        Inactif
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {trainers?.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground" data-testid="text-no-trainers">
                Aucun formateur
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par ajouter votre premier formateur.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setShowForm(true)}
                  data-testid="button-add-first-trainer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un formateur
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
