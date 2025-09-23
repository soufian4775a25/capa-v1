import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RoomForm from "@/components/forms/room-form";
import ProgressBar from "@/components/ui/progress-bar";
import { Plus, Edit, Trash2, Building, Users, Wrench } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@shared/schema";

export default function Rooms() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated,
  });

  const { data: roomOccupancy } = useQuery({
    queryKey: ["/api/capacity/room-occupancy"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Succès",
        description: "Salle supprimée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la salle",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const getRoomOccupancy = (roomId: string) => {
    return roomOccupancy?.find(r => r.roomId === roomId) || {
      occupiedHours: 0,
      availableHours: 40,
      occupationRate: 0
    };
  };

  const getTypeIcon = (type: string) => {
    return type === 'workshop' ? Wrench : Building;
  };

  const getTypeBadge = (type: string) => {
    return type === 'workshop' ? 
      <Badge className="bg-purple-100 text-purple-800">Atelier</Badge> :
      <Badge className="bg-blue-100 text-blue-800">Salle de cours</Badge>;
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
                Salles & Ateliers
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Gérer les espaces de formation et leur disponibilité
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              data-testid="button-add-room"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Salle
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-form-title">
                  {editingRoom ? "Modifier la salle" : "Nouvelle salle"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RoomForm 
                  room={editingRoom} 
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingRoom(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Room Stats */}
          {rooms && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Salles</p>
                      <p className="text-2xl font-bold text-blue-600" data-testid="text-total-rooms">
                        {rooms.filter(r => r.type === 'classroom').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="text-blue-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Ateliers</p>
                      <p className="text-2xl font-bold text-purple-600" data-testid="text-total-workshops">
                        {rooms.filter(r => r.type === 'workshop').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Wrench className="text-purple-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Occupation Moyenne</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-avg-occupancy">
                        {roomOccupancy && roomOccupancy.length > 0 
                          ? Math.round(roomOccupancy.reduce((sum, r) => sum + r.occupationRate, 0) / roomOccupancy.length)
                          : 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="text-green-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => {
              const occupancy = getRoomOccupancy(room.id);
              const TypeIcon = getTypeIcon(room.type);

              return (
                <Card key={room.id} className="shadow-sm border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          room.type === 'workshop' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          <TypeIcon className={`h-6 w-6 ${
                            room.type === 'workshop' ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate" data-testid={`text-room-name-${room.id}`}>
                            {room.name}
                          </CardTitle>
                          {getTypeBadge(room.type)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(room)}
                          data-testid={`button-edit-room-${room.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(room.id)}
                          data-testid={`button-delete-room-${room.id}`}
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
                          <span className="text-sm text-muted-foreground">Capacité</span>
                        </div>
                        <span className="font-medium" data-testid={`text-room-capacity-${room.id}`}>
                          {room.capacity} personnes
                        </span>
                      </div>

                      {room.equipment && room.equipment.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Équipements</p>
                          <div className="flex flex-wrap gap-1">
                            {room.equipment.slice(0, 3).map((equipment, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs"
                                data-testid={`badge-equipment-${room.id}-${index}`}
                              >
                                {equipment}
                              </Badge>
                            ))}
                            {room.equipment.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.equipment.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Occupation</span>
                          <span className="font-medium text-sm" data-testid={`text-room-occupancy-${room.id}`}>
                            {occupancy.occupationRate}%
                          </span>
                        </div>
                        <ProgressBar 
                          value={occupancy.occupationRate}
                          barClassName={
                            occupancy.occupationRate > 80 ? "bg-red-500" : 
                            occupancy.occupationRate > 60 ? "bg-amber-500" : 
                            "bg-green-500"
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span data-testid={`text-room-occupied-hours-${room.id}`}>
                            {occupancy.occupiedHours}h occupées
                          </span>
                          <span data-testid={`text-room-available-hours-${room.id}`}>
                            {occupancy.availableHours - occupancy.occupiedHours}h libres
                          </span>
                        </div>
                      </div>

                      {room.isActive ? (
                        <Badge className="bg-green-100 text-green-800" data-testid={`status-room-active-${room.id}`}>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`status-room-inactive-${room.id}`}>
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {rooms?.length === 0 && (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground" data-testid="text-no-rooms">
                Aucune salle
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par ajouter votre première salle ou atelier.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setShowForm(true)}
                  data-testid="button-add-first-room"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une salle
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
