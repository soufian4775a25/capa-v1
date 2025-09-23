import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TrainingGroup, InsertTrainingGroup, Room } from "@shared/schema";

interface GroupFormProps {
  group?: TrainingGroup | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const [formData, setFormData] = useState<InsertTrainingGroup>({
    name: group?.name || "",
    participantCount: group?.participantCount || 20,
    startDate: group?.startDate ? new Date(group.startDate) : new Date(),
    endDate: group?.endDate ? new Date(group.endDate) : undefined,
    estimatedEndDate: group?.estimatedEndDate ? new Date(group.estimatedEndDate) : undefined,
    status: group?.status || "planned",
    delayDays: group?.delayDays || 0,
    roomId: group?.roomId || null,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTrainingGroup) => {
      // Convert dates to ISO strings for API
      const payload = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
        estimatedEndDate: data.estimatedEndDate?.toISOString(),
      };
      return await apiRequest("POST", "/api/training-groups", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-groups"] });
      toast({
        title: "Succès",
        description: "Groupe créé avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTrainingGroup) => {
      // Convert dates to ISO strings for API
      const payload = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
        estimatedEndDate: data.estimatedEndDate?.toISOString(),
      };
      return await apiRequest("PUT", `/api/training-groups/${group?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-groups"] });
      toast({
        title: "Succès",
        description: "Groupe modifié avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le groupe",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (group) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Calculate estimated end date if not set
  const calculateEstimatedEndDate = (startDate: Date) => {
    const estimatedDuration = 90; // 90 days default (aligned with capacity page)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + estimatedDuration);
    return endDate;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom du groupe</Label>
          <Input
            id="name"
            data-testid="input-group-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Groupe A-2024"
            required
          />
        </div>

        <div>
          <Label htmlFor="participantCount">Nombre de participants</Label>
          <Input
            id="participantCount"
            data-testid="input-group-participants"
            type="number"
            min="1"
            max="50"
            value={formData.participantCount}
            onChange={(e) => setFormData({ ...formData, participantCount: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div>
          <Label htmlFor="startDate">Date de début</Label>
          <Input
            id="startDate"
            data-testid="input-group-start-date"
            type="date"
            value={formData.startDate.toISOString().split('T')[0]}
            onChange={(e) => {
              const newStartDate = new Date(e.target.value);
              setFormData({ 
                ...formData, 
                startDate: newStartDate,
                estimatedEndDate: formData.estimatedEndDate || calculateEstimatedEndDate(newStartDate)
              });
            }}
            required
          />
        </div>

        <div>
          <Label htmlFor="estimatedEndDate">Date de fin estimée</Label>
          <Input
            id="estimatedEndDate"
            data-testid="input-group-estimated-end-date"
            type="date"
            value={formData.estimatedEndDate?.toISOString().split('T')[0] || ""}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : undefined;
              setFormData({ ...formData, estimatedEndDate: date });
            }}
          />
        </div>

        <div>
          <Label htmlFor="roomId">Salle assignée</Label>
          <Select 
            value={formData.roomId || "none"} 
            onValueChange={(value) => setFormData({ ...formData, roomId: value === "none" ? null : value })}
          >
            <SelectTrigger data-testid="select-group-room">
              <SelectValue placeholder="Sélectionner une salle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune salle</SelectItem>
              {rooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} (Capacité: {room.capacity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Statut</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: "planned" | "active" | "completed" | "delayed") => 
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger data-testid="select-group-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planifié</SelectItem>
              <SelectItem value="active">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="delayed">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.status === "delayed" && (
          <div>
            <Label htmlFor="delayDays">Retard (jours)</Label>
            <Input
              id="delayDays"
              data-testid="input-group-delay-days"
              type="number"
              min="0"
              max="365"
              value={formData.delayDays || 0}
              onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Informations calculées</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Durée prévue:</span>
            <p className="font-medium" data-testid="text-calculated-duration">
              {formData.estimatedEndDate && formData.startDate ? 
                Math.ceil((formData.estimatedEndDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + " jours"
                : "Non calculé"
              }
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Salle sélectionnée:</span>
            <p className="font-medium" data-testid="text-selected-room">
              {formData.roomId ? 
                rooms?.find(r => r.id === formData.roomId)?.name || "Salle inconnue"
                : "Aucune"
              }
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          data-testid="button-cancel-group"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-save-group"
        >
          {isLoading ? "Enregistrement..." : (group ? "Modifier" : "Créer")}
        </Button>
      </div>
    </form>
  );
}
