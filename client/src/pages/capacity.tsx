import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertTriangle, CheckCircle, Clock, Users, BarChart3 } from "lucide-react";
import type { TrainingGroup, Room, Module, Trainer } from "@shared/schema";

export default function Capacity() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: groups } = useQuery<TrainingGroup[]>({
    queryKey: ["/api/training-groups"],
    enabled: isAuthenticated,
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated,
  });

  const { data: modules } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
    enabled: isAuthenticated,
  });

  const { data: trainers } = useQuery<Trainer[]>({
    queryKey: ["/api/trainers"],
    enabled: isAuthenticated,
  });

  const { data: capacityAnalysis } = useQuery({
    queryKey: ["/api/capacity/analysis"],
    enabled: isAuthenticated,
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/group-module-schedules"],
    enabled: isAuthenticated,
  });
  if (!isAuthenticated) {
    return null;
  }

  // Generate months for the selected year and next year
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  const yearRange = [selectedYear, selectedYear + 1];

  // Calculate room constraints for each month
  const calculateRoomConstraints = (month: number, year: number) => {
    if (!groups || !rooms) return { classroom: 0, workshop: 0 };
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    let classroomCount = 0;
    let workshopCount = 0;
    
    groups.forEach(group => {
      const groupStart = new Date(group.startDate);
      const groupEnd = group.endDate ? new Date(group.endDate) : 
                      group.estimatedEndDate ? new Date(group.estimatedEndDate) : 
                      new Date(groupStart.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days
      
      // Check if group overlaps with this month
      if (groupStart <= monthEnd && groupEnd >= monthStart && group.roomId) {
        const room = rooms.find(r => r.id === group.roomId);
        if (room) {
          if (room.type === 'classroom') {
            classroomCount++;
          } else if (room.type === 'workshop') {
            workshopCount++;
          }
        }
      }
    });
    
    return { classroom: classroomCount, workshop: workshopCount };
  };

  // Calculate trainer constraints for each month
  const calculateTrainerConstraints = (month: number, year: number) => {
    if (!groups || !trainers) return { required: 0, available: 0 };
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    let requiredTrainers = 0;
    
    groups.forEach(group => {
      const groupStart = new Date(group.startDate);
      const groupEnd = group.endDate ? new Date(group.endDate) : 
                      group.estimatedEndDate ? new Date(group.estimatedEndDate) : 
                      new Date(groupStart.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      // Check if group overlaps with this month
      if (groupStart <= monthEnd && groupEnd >= monthStart && group.status !== 'completed') {
        requiredTrainers++;
      }
    });
    
    const availableTrainers = trainers.filter(t => t.isActive).length;
    
    return { required: requiredTrainers, available: availableTrainers };
  };

  // Calculate monthly indicators
  const calculateMonthlyIndicators = (month: number, year: number) => {
    if (!groups || !rooms || !trainers) return { participants: 0, occupationRate: 0, conflicts: 0 };
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    let totalParticipants = 0;
    let activeGroups = 0;
    let conflicts = 0;
    
    groups.forEach(group => {
      const groupStart = new Date(group.startDate);
      const groupEnd = group.endDate ? new Date(group.endDate) : 
                      group.estimatedEndDate ? new Date(group.estimatedEndDate) : 
                      new Date(groupStart.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      if (groupStart <= monthEnd && groupEnd >= monthStart && group.status !== 'completed') {
        totalParticipants += group.participantCount;
        activeGroups++;
      }
    });
    
    const roomConstraints = calculateRoomConstraints(month, year);
    const trainerConstraints = calculateTrainerConstraints(month, year);
    
    if (hasConflict(roomConstraints)) conflicts++;
    if (trainerConstraints.required > trainerConstraints.available) conflicts++;
    
    const maxCapacity = rooms.filter(r => r.isActive).reduce((sum, room) => sum + room.capacity, 0);
    const occupationRate = maxCapacity > 0 ? Math.round((totalParticipants / maxCapacity) * 100) : 0;
    
    return { participants: totalParticipants, occupationRate, conflicts, activeGroups };
  };

  // Check if there's a conflict (more groups than available rooms)
  const hasConflict = (constraints: { classroom: number; workshop: number }) => {
    const availableClassrooms = rooms?.filter(r => r.type === 'classroom' && r.isActive).length || 0;
    const availableWorkshops = rooms?.filter(r => r.type === 'workshop' && r.isActive).length || 0;
    
    return constraints.classroom > availableClassrooms || constraints.workshop > availableWorkshops;
  };

  // Check trainer conflicts
  const hasTrainerConflict = (trainerConstraints: { required: number; available: number }) => {
    return trainerConstraints.required > trainerConstraints.available;
  };

  // Get group timeline for a specific month
  const getGroupTimeline = (group: TrainingGroup, month: number, year: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const groupStart = new Date(group.startDate);
    const groupEnd = group.endDate ? new Date(group.endDate) : 
                    group.estimatedEndDate ? new Date(group.estimatedEndDate) : 
                    new Date(groupStart.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    // Check if group overlaps with this month
    if (groupStart <= monthEnd && groupEnd >= monthStart) {
      const isStart = groupStart.getMonth() === month && groupStart.getFullYear() === year;
      const isEnd = groupEnd.getMonth() === month && groupEnd.getFullYear() === year;
      const isActive = groupStart <= monthEnd && groupEnd >= monthStart;
      
      return { isActive, isStart, isEnd };
    }
    
    return { isActive: false, isStart: false, isEnd: false };
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-page-title">
                Charge Capacité
              </h2>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Visualisation de la charge et disponibilité des ressources
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
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() + i - 1;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Capacity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Groupes Actifs</p>
                    <p className="text-2xl font-bold">{groups?.filter(g => g.status === 'active').length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Salles Disponibles</p>
                    <p className="text-2xl font-bold">{rooms?.filter(r => r.type === 'classroom' && r.isActive).length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ateliers Disponibles</p>
                    <p className="text-2xl font-bold">{rooms?.filter(r => r.type === 'workshop' && r.isActive).length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Groupes Planifiés</p>
                    <p className="text-2xl font-bold">{groups?.filter(g => g.status === 'planned').length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Formateurs Actifs</p>
                    <p className="text-2xl font-bold">{trainers?.filter(t => t.isActive).length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capacity Analysis */}
          {capacityAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                    {capacityAnalysis.trainerConstraints?.slice(0, 5).map((constraint, index) => (
                      <div key={constraint.trainerId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{constraint.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {constraint.availableHours}h disponibles
                          </p>
                        </div>
                        <Badge 
                          className={constraint.isOverloaded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
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
                    <Calendar className="h-5 w-5" />
                    <span>Contraintes Salles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {capacityAnalysis.roomConstraints?.slice(0, 5).map((constraint, index) => (
                      <div key={constraint.roomId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{constraint.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {constraint.type === 'workshop' ? 'Atelier' : 'Salle'} - {constraint.availableCapacity}h libres
                          </p>
                        </div>
                        <Badge 
                          className={constraint.isOverbooked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                        >
                          {constraint.isOverbooked ? "Surbookée" : "OK"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recommendations */}
          {capacityAnalysis?.recommendations && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Recommandations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {capacityAnalysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-blue-50">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Monthly Analysis Indicators */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Indicateurs Mensuels - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  const indicators = calculateMonthlyIndicators(currentMonth, currentYear);
                  const trainerConstraints = calculateTrainerConstraints(currentMonth, currentYear);
                  
                  return (
                    <>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Participants Totaux</p>
                        <p className="text-2xl font-bold text-blue-800">{indicators.participants}</p>
                        <p className="text-xs text-blue-600">dans {indicators.activeGroups} groupes</p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Taux d'Occupation</p>
                        <p className="text-2xl font-bold text-green-800">{indicators.occupationRate}%</p>
                        <p className="text-xs text-green-600">capacité utilisée</p>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Formateurs Requis</p>
                        <p className="text-2xl font-bold text-purple-800">{trainerConstraints.required}/{trainerConstraints.available}</p>
                        <p className="text-xs text-purple-600">requis/disponibles</p>
                      </div>
                      
                      <div className={`text-center p-4 rounded-lg ${
                        indicators.conflicts > 0 ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        <p className={`text-sm font-medium ${
                          indicators.conflicts > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>Conflits Détectés</p>
                        <p className={`text-2xl font-bold ${
                          indicators.conflicts > 0 ? 'text-red-800' : 'text-green-800'
                        }`}>{indicators.conflicts}</p>
                        <p className={`text-xs ${
                          indicators.conflicts > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>{indicators.conflicts > 0 ? 'attention requise' : 'situation normale'}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Planning de Charge - {selectedYear}/{selectedYear + 1}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  {/* Header Row */}
                  <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'minmax(150px, 200px) repeat(24, minmax(60px, 1fr))' }}>
                    <div className="font-semibold text-sm p-2 bg-muted rounded">Groupe</div>
                    {yearRange.map(year => 
                      months.map((month, monthIndex) => (
                        <div key={`${year}-${monthIndex}`} className="font-semibold text-xs p-1 bg-muted rounded text-center">
                          {month}<br/>{year}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Groups Rows */}
                  {groups?.map(group => (
                    <div key={group.id} className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'minmax(150px, 200px) repeat(24, minmax(60px, 1fr))' }}>
                      <div className="p-2 border rounded font-medium text-sm bg-card">
                        <div className="truncate">{group.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.participantCount} pers.
                        </div>
                      </div>
                      {yearRange.map(year => 
                        months.map((_, monthIndex) => {
                          const timeline = getGroupTimeline(group, monthIndex, year);
                          return (
                            <div key={`${year}-${monthIndex}`} className="relative">
                              <div className={`h-12 border rounded p-1 ${
                                timeline.isActive 
                                  ? group.status === 'active' 
                                    ? 'bg-green-200 border-green-400' 
                                    : group.status === 'delayed'
                                    ? 'bg-amber-200 border-amber-400'
                                    : 'bg-blue-200 border-blue-400'
                                  : 'bg-gray-50'
                              }`}>
                                {timeline.isStart && (
                                  <div className="absolute top-0 left-0 w-2 h-full bg-green-600 rounded-l"></div>
                                )}
                                {timeline.isEnd && (
                                  <div className="absolute top-0 right-0 w-2 h-full bg-red-600 rounded-r"></div>
                                )}
                                {timeline.isActive && (
                                  <div className="text-xs text-center mt-1">
                                    {timeline.isStart && '🟢'}
                                    {timeline.isEnd && '🔴'}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}

                  {/* Constraints Rows */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'minmax(150px, 200px) repeat(24, minmax(60px, 1fr))' }}>
                      <div className="p-2 border rounded font-medium text-sm bg-amber-50">
                        Contrainte Salle
                      </div>
                      {yearRange.map(year => 
                        months.map((_, monthIndex) => {
                          const constraints = calculateRoomConstraints(monthIndex, year);
                          const conflict = hasConflict(constraints);
                          return (
                            <div key={`classroom-${year}-${monthIndex}`} className={`h-8 border rounded flex items-center justify-center text-sm font-bold ${
                              conflict ? 'bg-red-200 text-red-800' : constraints.classroom > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-50'
                            }`}>
                              {constraints.classroom > 0 ? constraints.classroom : ''}
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'minmax(150px, 200px) repeat(24, minmax(60px, 1fr))' }}>
                      <div className="p-2 border rounded font-medium text-sm bg-blue-50">
                        Contrainte Atelier
                      </div>
                      {yearRange.map(year => 
                        months.map((_, monthIndex) => {
                          const constraints = calculateRoomConstraints(monthIndex, year);
                          const conflict = hasConflict(constraints);
                          return (
                            <div key={`workshop-${year}-${monthIndex}`} className={`h-8 border rounded flex items-center justify-center text-sm font-bold ${
                              conflict ? 'bg-red-200 text-red-800' : constraints.workshop > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'
                            }`}>
                              {constraints.workshop > 0 ? constraints.workshop : ''}
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="grid gap-1" style={{ gridTemplateColumns: 'minmax(150px, 200px) repeat(24, minmax(60px, 1fr))' }}>
                      <div className="p-2 border rounded font-medium text-sm bg-purple-50">
                        Contrainte Formateur
                      </div>
                      {yearRange.map(year => 
                        months.map((_, monthIndex) => {
                          const trainerConstraints = calculateTrainerConstraints(monthIndex, year);
                          const conflict = hasTrainerConflict(trainerConstraints);
                          return (
                            <div key={`trainer-${year}-${monthIndex}`} className={`h-8 border rounded flex items-center justify-center text-sm font-bold ${
                              conflict ? 'bg-red-200 text-red-800' : trainerConstraints.required > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-50'
                            }`}>
                              {trainerConstraints.required > 0 ? `${trainerConstraints.required}/${trainerConstraints.available}` : ''}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Légende</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-200 border-green-400 border rounded"></div>
                  <span className="text-sm">Formation active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-200 border-blue-400 border rounded"></div>
                  <span className="text-sm">Formation planifiée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-amber-200 border-amber-400 border rounded"></div>
                  <span className="text-sm">Formation retardée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-200 border-red-400 border rounded"></div>
                  <span className="text-sm">Conflit de ressources</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-4 bg-green-600 rounded"></div>
                  <span className="text-sm">Début de formation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm">Fin prévue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🟢 = Démarrage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🔴 = Fin provisoire</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-100 border-purple-400 border rounded"></div>
                  <span className="text-sm">Contrainte formateur</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">X/Y</span>
                  <span className="text-sm">= Requis/Disponibles</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}