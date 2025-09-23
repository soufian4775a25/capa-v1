import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GroupForm from "@/components/forms/group-form";
import ProgressBar from "@/components/ui/progress-bar";
import { Plus, Edit, Trash2, UsersRound, Calendar, Users, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TrainingGroup, Room, GroupModuleSchedule } from "@shared/schema";

export default function Groups() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrainingGroup | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: groups, isLoading } = useQuery<TrainingGroup[]>({
    queryKey: ["/api/training-groups"],
    enabled: isAuthenticated,
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated,
  });

  const { data: schedules } = useQuery<GroupModuleSchedule[]>({
    queryKey: ["/api/group-module-schedules"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/training-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-groups"] });
      toast({
        title: "Succès",
        description: "Groupe supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le groupe",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce groupe ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (group: TrainingGroup) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingGroup(null);
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

  const getGroupProgress = (groupId: string) => {
    const groupSchedules = schedules?.filter(s => s.groupId === groupId) || [];
    if (groupSchedules.length === 0) return 0;
    
    const totalProgress = groupSchedules.reduce((sum, schedule) => sum + (schedule.progress || 0), 0);
    return Math.round(totalProgress / groupSchedules.length);
  };

  const getRoomName = (roomId?: string | null) => {
    if (!roomId) return "Non assigné";
    const room = rooms?.find(r => r.id === roomId);
    return room?.name || "Salle inconnue";
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
                Groupes de Formation
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Gérer les groupes et leur planification
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              data-testid="button-add-group"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Groupe
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-form-title">
                  {editingGroup ? "Modifier le groupe" : "Nouveau groupe"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GroupForm 
                  group={editingGroup} 
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingGroup(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Groups Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups?.map((group) => {
              const progress = getGroupProgress(group.id);
              const roomName = getRoomName(group.roomId);

              return (
                <Card key={group.id} className="shadow-sm border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UsersRound className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate" data-testid={`text-group-name-${group.id}`}>
                            {group.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(group.status)}
                            {group.delayDays && group.delayDays > 0 && (
                              <Badge variant="outline" className="text-amber-600">
                                +{group.delayDays}j
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(group)}
                          data-testid={`button-edit-group-${group.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(group.id)}
                          data-testid={`button-delete-group-${group.id}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Participants</span>
                        </div>
                        <span className="font-medium" data-testid={`text-group-participants-${group.id}`}>
                          {group.participantCount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Salle</span>
                        </div>
                        <span className="font-medium text-sm" data-testid={`text-group-room-${group.id}`}>
                          {roomName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Début</span>
                        </div>
                        <span className="font-medium text-sm" data-testid={`text-group-start-${group.id}`}>
                          {new Date(group.startDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      {group.estimatedEndDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Fin prévue</span>
                          <span className="font-medium text-sm" data-testid={`text-group-end-${group.id}`}>
                            {new Date(group.estimatedEndDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Progression</span>
                          <span className="font-medium text-sm" data-testid={`text-group-progress-${group.id}`}>
                            {progress}%
                          </span>
                        </div>
                        <ProgressBar 
                          value={progress}
                          barClassName={
                            progress < 30 ? "bg-red-500" : 
                            progress < 70 ? "bg-amber-500" : 
                            "bg-green-500"
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {groups?.length === 0 && (
            <div className="text-center py-12">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground" data-testid="text-no-groups">
                Aucun groupe de formation
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par créer votre premier groupe de formation.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setShowForm(true)}
                  data-testid="button-add-first-group"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un groupe
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
