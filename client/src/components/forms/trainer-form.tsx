import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import type { Trainer, InsertTrainer } from "@shared/schema";

interface TrainerFormProps {
  trainer?: Trainer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TrainerForm({ trainer, onSuccess, onCancel }: TrainerFormProps) {
  const [formData, setFormData] = useState<InsertTrainer>({
    name: trainer?.name || "",
    email: trainer?.email || "",
    specialties: trainer?.specialties || [],
    maxHoursPerWeek: trainer?.maxHoursPerWeek || 35,
    isActive: trainer?.isActive ?? true,
    absences: trainer?.absences || [],
  });

  const [currentSpecialty, setCurrentSpecialty] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: InsertTrainer) => {
      return await apiRequest("POST", "/api/trainers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
      toast({
        title: "Succès",
        description: "Formateur créé avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le formateur",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTrainer) => {
      return await apiRequest("PUT", `/api/trainers/${trainer?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
      toast({
        title: "Succès",
        description: "Formateur modifié avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le formateur",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (trainer) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addSpecialty = () => {
    if (currentSpecialty.trim() && !formData.specialties?.includes(currentSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...(formData.specialties || []), currentSpecialty.trim()]
      });
      setCurrentSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: (formData.specialties || []).filter(s => s !== specialty)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpecialty();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            data-testid="input-trainer-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            data-testid="input-trainer-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="maxHours">Heures maximum par semaine</Label>
        <Input
          id="maxHours"
          data-testid="input-trainer-max-hours"
          type="number"
          min="1"
          max="60"
          value={formData.maxHoursPerWeek}
          onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: parseInt(e.target.value) || 0 })}
          required
        />
      </div>

      <div>
        <Label>Spécialités</Label>
        <div className="flex items-center space-x-2 mt-2">
          <Input
            data-testid="input-trainer-specialty"
            type="text"
            placeholder="Ajouter une spécialité"
            value={currentSpecialty}
            onChange={(e) => setCurrentSpecialty(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button 
            type="button" 
            onClick={addSpecialty}
            data-testid="button-add-specialty"
            variant="secondary"
          >
            Ajouter
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {(formData.specialties || []).map((specialty, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <span data-testid={`text-specialty-${index}`}>{specialty}</span>
              <button
                type="button"
                onClick={() => removeSpecialty(specialty)}
                data-testid={`button-remove-specialty-${index}`}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          data-testid="switch-trainer-active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Formateur actif</Label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          data-testid="button-cancel-trainer"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-save-trainer"
        >
          {isLoading ? "Enregistrement..." : (trainer ? "Modifier" : "Créer")}
        </Button>
      </div>
    </form>
  );
}
