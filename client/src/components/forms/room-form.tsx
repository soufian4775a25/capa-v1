import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import type { Room, InsertRoom } from "@shared/schema";

interface RoomFormProps {
  room?: Room | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RoomForm({ room, onSuccess, onCancel }: RoomFormProps) {
  const [formData, setFormData] = useState<InsertRoom>({
    name: room?.name || "",
    type: room?.type || "classroom",
    capacity: room?.capacity || 20,
    equipment: room?.equipment || [],
    isActive: room?.isActive ?? true,
  });

  const [currentEquipment, setCurrentEquipment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: InsertRoom) => {
      return await apiRequest("POST", "/api/rooms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Succès",
        description: "Salle créée avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la salle",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertRoom) => {
      return await apiRequest("PUT", `/api/rooms/${room?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Succès",
        description: "Salle modifiée avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la salle",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (room) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addEquipment = () => {
    if (currentEquipment.trim() && !(formData.equipment || []).includes(currentEquipment.trim())) {
      setFormData({
        ...formData,
        equipment: [...(formData.equipment || []), currentEquipment.trim()]
      });
      setCurrentEquipment("");
    }
  };

  const removeEquipment = (equipment: string) => {
    setFormData({
      ...formData,
      equipment: (formData.equipment || []).filter(e => e !== equipment)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEquipment();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom de la salle</Label>
          <Input
            id="name"
            data-testid="input-room-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Salle 1, Atelier Informatique"
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: "classroom" | "workshop") => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger data-testid="select-room-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classroom">Salle de cours</SelectItem>
              <SelectItem value="workshop">Atelier pratique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="capacity">Capacité (personnes)</Label>
          <Input
            id="capacity"
            data-testid="input-room-capacity"
            type="number"
            min="1"
            max="100"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div>
        <Label>Équipements disponibles</Label>
        <div className="flex items-center space-x-2 mt-2">
          <Input
            data-testid="input-room-equipment"
            type="text"
            placeholder="Ajouter un équipement"
            value={currentEquipment}
            onChange={(e) => setCurrentEquipment(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button 
            type="button" 
            onClick={addEquipment}
            data-testid="button-add-equipment"
            variant="secondary"
          >
            Ajouter
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {(formData.equipment || []).map((equipment, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <span data-testid={`text-equipment-${index}`}>{equipment}</span>
              <button
                type="button"
                onClick={() => removeEquipment(equipment)}
                data-testid={`button-remove-equipment-${index}`}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick Equipment Presets */}
      <div>
        <Label>Équipements prédéfinis</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {["Projecteur", "Écran", "Tableau blanc", "Ordinateurs", "Wi-Fi", "Climatisation", "Imprimante", "Scanner"].map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="sm"
              data-testid={`button-preset-${preset.toLowerCase()}`}
              onClick={() => {
                if (!(formData.equipment || []).includes(preset)) {
                  setFormData({
                    ...formData,
                    equipment: [...(formData.equipment || []), preset]
                  });
                }
              }}
              disabled={(formData.equipment || []).includes(preset)}
              className="text-xs"
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>

      {/* Room Information */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Informations de la salle</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium" data-testid="text-room-type-display">
              {formData.type === 'workshop' ? 'Atelier pratique' : 'Salle de cours'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Capacité:</span>
            <p className="font-medium" data-testid="text-room-capacity-display">
              {formData.capacity} personnes
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Équipements:</span>
            <p className="font-medium" data-testid="text-room-equipment-count">
              {(formData.equipment || []).length} équipement{(formData.equipment || []).length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          data-testid="switch-room-active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Salle active</Label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          data-testid="button-cancel-room"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-save-room"
        >
          {isLoading ? "Enregistrement..." : (room ? "Modifier" : "Créer")}
        </Button>
      </div>
    </form>
  );
}
