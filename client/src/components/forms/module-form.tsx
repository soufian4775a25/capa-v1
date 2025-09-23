import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Module, InsertModule } from "@shared/schema";

interface ModuleFormProps {
  module?: Module | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ModuleForm({ module, onSuccess, onCancel }: ModuleFormProps) {
  const [formData, setFormData] = useState<InsertModule>({
    name: module?.name || "",
    description: module?.description || "",
    totalHours: module?.totalHours || 40,
    sessionsPerWeek: module?.sessionsPerWeek || 2,
    hoursPerSession: module?.hoursPerSession || "2.00",
    type: module?.type || "theoretical",
    isActive: module?.isActive ?? true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: InsertModule) => {
      return await apiRequest("POST", "/api/modules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      toast({
        title: "Succès",
        description: "Module créé avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le module",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertModule) => {
      return await apiRequest("PUT", `/api/modules/${module?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      toast({
        title: "Succès",
        description: "Module modifié avec succès",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le module",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (module) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const estimatedWeeks = Math.ceil(formData.totalHours / (formData.sessionsPerWeek * Number(formData.hoursPerSession)));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nom du module</Label>
          <Input
            id="name"
            data-testid="input-module-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            data-testid="input-module-description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Description du module (optionnel)"
          />
        </div>

        <div>
          <Label htmlFor="type">Type de module</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: "theoretical" | "practical") => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger data-testid="select-module-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="theoretical">Théorique</SelectItem>
              <SelectItem value="practical">Pratique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="totalHours">Durée totale (heures)</Label>
          <Input
            id="totalHours"
            data-testid="input-module-total-hours"
            type="number"
            min="1"
            max="500"
            value={formData.totalHours}
            onChange={(e) => setFormData({ ...formData, totalHours: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div>
          <Label htmlFor="sessionsPerWeek">Séances par semaine</Label>
          <Input
            id="sessionsPerWeek"
            data-testid="input-module-sessions-per-week"
            type="number"
            min="1"
            max="10"
            value={formData.sessionsPerWeek}
            onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div>
          <Label htmlFor="hoursPerSession">Heures par séance</Label>
          <Input
            id="hoursPerSession"
            data-testid="input-module-hours-per-session"
            type="number"
            min="0.5"
            max="8"
            step="0.5"
            value={formData.hoursPerSession}
            onChange={(e) => setFormData({ ...formData, hoursPerSession: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Calculated Information */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Calculs automatiques</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Durée estimée:</span>
            <p className="font-medium" data-testid="text-estimated-duration">
              {estimatedWeeks} semaine{estimatedWeeks > 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Heures par semaine:</span>
            <p className="font-medium" data-testid="text-hours-per-week">
              {formData.sessionsPerWeek * Number(formData.hoursPerSession)}h
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Séances totales:</span>
            <p className="font-medium" data-testid="text-total-sessions">
              {Math.ceil(formData.totalHours / Number(formData.hoursPerSession))}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          data-testid="switch-module-active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Module actif</Label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          data-testid="button-cancel-module"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-save-module"
        >
          {isLoading ? "Enregistrement..." : (module ? "Modifier" : "Créer")}
        </Button>
      </div>
    </form>
  );
}
