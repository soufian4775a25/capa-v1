import { 
  users, trainers, modules, rooms, trainingGroups, 
  moduleTrainerAssignments, groupModuleSchedule,
  type User, type InsertUser, type Trainer, type InsertTrainer,
  type Module, type InsertModule, type Room, type InsertRoom,
  type TrainingGroup, type InsertTrainingGroup,
  type ModuleTrainerAssignment, type InsertModuleTrainerAssignment,
  type GroupModuleSchedule, type InsertGroupModuleSchedule
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trainers
  getAllTrainers(): Promise<Trainer[]>;
  getTrainer(id: string): Promise<Trainer | undefined>;
  createTrainer(trainer: InsertTrainer): Promise<Trainer>;
  updateTrainer(id: string, trainer: Partial<InsertTrainer>): Promise<Trainer | undefined>;
  deleteTrainer(id: string): Promise<boolean>;

  // Modules
  getAllModules(): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, module: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: string): Promise<boolean>;

  // Rooms
  getAllRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;

  // Training Groups
  getAllTrainingGroups(): Promise<TrainingGroup[]>;
  getTrainingGroup(id: string): Promise<TrainingGroup | undefined>;
  createTrainingGroup(group: InsertTrainingGroup): Promise<TrainingGroup>;
  updateTrainingGroup(id: string, group: Partial<InsertTrainingGroup>): Promise<TrainingGroup | undefined>;
  deleteTrainingGroup(id: string): Promise<boolean>;

  // Module Trainer Assignments
  getModuleTrainerAssignments(): Promise<ModuleTrainerAssignment[]>;
  createModuleTrainerAssignment(assignment: InsertModuleTrainerAssignment): Promise<ModuleTrainerAssignment>;
  deleteModuleTrainerAssignment(moduleId: string, trainerId: string): Promise<boolean>;

  // Group Module Schedule
  getGroupModuleSchedules(): Promise<GroupModuleSchedule[]>;
  getGroupModuleSchedulesByGroup(groupId: string): Promise<GroupModuleSchedule[]>;
  createGroupModuleSchedule(schedule: InsertGroupModuleSchedule): Promise<GroupModuleSchedule>;
  updateGroupModuleSchedule(id: string, schedule: Partial<InsertGroupModuleSchedule>): Promise<GroupModuleSchedule | undefined>;
  deleteGroupModuleSchedule(id: string): Promise<boolean>;

  // Capacity calculations
  calculateTrainerWorkload(): Promise<Array<{trainerId: string, name: string, currentHours: number, maxHours: number, occupationRate: number}>>;
  calculateRoomOccupancy(): Promise<Array<{roomId: string, name: string, occupiedHours: number, availableHours: number, occupationRate: number}>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private trainers: Map<string, Trainer> = new Map();
  private modules: Map<string, Module> = new Map();
  private rooms: Map<string, Room> = new Map();
  private trainingGroups: Map<string, TrainingGroup> = new Map();
  private moduleTrainerAssignments: Map<string, ModuleTrainerAssignment> = new Map();
  private groupModuleSchedules: Map<string, GroupModuleSchedule> = new Map();

  constructor() {
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "chargecapa@2025", // In production, this should be hashed
      role: "admin"
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "admin",
      id, 
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Trainers
  async getAllTrainers(): Promise<Trainer[]> {
    return Array.from(this.trainers.values()).filter(trainer => trainer.isActive);
  }

  async getTrainer(id: string): Promise<Trainer | undefined> {
    return this.trainers.get(id);
  }

  async createTrainer(insertTrainer: InsertTrainer): Promise<Trainer> {
    const id = randomUUID();
    const trainer: Trainer = {
      ...insertTrainer,
      specialties: insertTrainer.specialties || [],
      isActive: insertTrainer.isActive ?? true,
      absences: insertTrainer.absences || [],
      id,
      currentHoursPerWeek: 0,
      createdAt: new Date()
    };
    this.trainers.set(id, trainer);
    return trainer;
  }

  async updateTrainer(id: string, trainerData: Partial<InsertTrainer>): Promise<Trainer | undefined> {
    const trainer = this.trainers.get(id);
    if (!trainer) return undefined;

    const updatedTrainer = { 
      ...trainer, 
      ...trainerData,
      specialties: trainerData.specialties || trainer.specialties || [],
      absences: trainerData.absences || trainer.absences || []
    };
    this.trainers.set(id, updatedTrainer);
    return updatedTrainer;
  }

  async deleteTrainer(id: string): Promise<boolean> {
    const trainer = this.trainers.get(id);
    if (!trainer) return false;
    
    trainer.isActive = false;
    this.trainers.set(id, trainer);
    return true;
  }

  // Modules
  async getAllModules(): Promise<Module[]> {
    return Array.from(this.modules.values()).filter(module => module.isActive);
  }

  async getModule(id: string): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = randomUUID();
    const module: Module = {
      ...insertModule,
      description: insertModule.description || null,
      isActive: insertModule.isActive ?? true,
      id,
      createdAt: new Date()
    };
    this.modules.set(id, module);
    return module;
  }

  async updateModule(id: string, moduleData: Partial<InsertModule>): Promise<Module | undefined> {
    const module = this.modules.get(id);
    if (!module) return undefined;

    const updatedModule = { ...module, ...moduleData };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: string): Promise<boolean> {
    const module = this.modules.get(id);
    if (!module) return false;
    
    module.isActive = false;
    this.modules.set(id, module);
    return true;
  }

  // Rooms
  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.isActive);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const room: Room = {
      ...insertRoom,
      equipment: insertRoom.equipment || [],
      isActive: insertRoom.isActive ?? true,
      id,
      createdAt: new Date()
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: string, roomData: Partial<InsertRoom>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...roomData };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const room = this.rooms.get(id);
    if (!room) return false;
    
    room.isActive = false;
    this.rooms.set(id, room);
    return true;
  }

  // Training Groups
  async getAllTrainingGroups(): Promise<TrainingGroup[]> {
    return Array.from(this.trainingGroups.values());
  }

  async getTrainingGroup(id: string): Promise<TrainingGroup | undefined> {
    return this.trainingGroups.get(id);
  }

  async createTrainingGroup(insertGroup: InsertTrainingGroup): Promise<TrainingGroup> {
    const id = randomUUID();
    const group: TrainingGroup = {
      ...insertGroup,
      status: insertGroup.status || "planned",
      endDate: insertGroup.endDate || null,
      estimatedEndDate: insertGroup.estimatedEndDate || null,
      delayDays: insertGroup.delayDays || 0,
      roomId: insertGroup.roomId || null,
      id,
      createdAt: new Date()
    };
    this.trainingGroups.set(id, group);
    
    // Auto-assign modules and trainers to the group
    await this.autoAssignModulesAndTrainers(id);
    
    return group;
  }

  async updateTrainingGroup(id: string, groupData: Partial<InsertTrainingGroup>): Promise<TrainingGroup | undefined> {
    const group = this.trainingGroups.get(id);
    if (!group) return undefined;

    const updatedGroup = { ...group, ...groupData };
    this.trainingGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteTrainingGroup(id: string): Promise<boolean> {
    return this.trainingGroups.delete(id);
  }

  // Module Trainer Assignments
  async getModuleTrainerAssignments(): Promise<ModuleTrainerAssignment[]> {
    return Array.from(this.moduleTrainerAssignments.values());
  }

  async createModuleTrainerAssignment(insertAssignment: InsertModuleTrainerAssignment): Promise<ModuleTrainerAssignment> {
    const id = randomUUID();
    const assignment: ModuleTrainerAssignment = {
      ...insertAssignment,
      canTeach: insertAssignment.canTeach ?? true,
      id
    };
    this.moduleTrainerAssignments.set(id, assignment);
    return assignment;
  }

  async deleteModuleTrainerAssignment(moduleId: string, trainerId: string): Promise<boolean> {
    const assignment = Array.from(this.moduleTrainerAssignments.values())
      .find(a => a.moduleId === moduleId && a.trainerId === trainerId);
    
    if (!assignment) return false;
    
    return this.moduleTrainerAssignments.delete(assignment.id);
  }

  // Group Module Schedule
  async getGroupModuleSchedules(): Promise<GroupModuleSchedule[]> {
    return Array.from(this.groupModuleSchedules.values());
  }

  async getGroupModuleSchedulesByGroup(groupId: string): Promise<GroupModuleSchedule[]> {
    return Array.from(this.groupModuleSchedules.values())
      .filter(schedule => schedule.groupId === groupId)
      .sort((a, b) => a.scheduledOrder - b.scheduledOrder);
  }

  async createGroupModuleSchedule(insertSchedule: InsertGroupModuleSchedule): Promise<GroupModuleSchedule> {
    const id = randomUUID();
    const schedule: GroupModuleSchedule = {
      ...insertSchedule,
      startDate: insertSchedule.startDate || null,
      endDate: insertSchedule.endDate || null,
      progress: insertSchedule.progress || 0,
      hoursCompleted: insertSchedule.hoursCompleted || "0",
      status: insertSchedule.status || "planned",
      id
    };
    this.groupModuleSchedules.set(id, schedule);
    return schedule;
  }

  async updateGroupModuleSchedule(id: string, scheduleData: Partial<InsertGroupModuleSchedule>): Promise<GroupModuleSchedule | undefined> {
    const schedule = this.groupModuleSchedules.get(id);
    if (!schedule) return undefined;

    const updatedSchedule = { ...schedule, ...scheduleData };
    this.groupModuleSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteGroupModuleSchedule(id: string): Promise<boolean> {
    return this.groupModuleSchedules.delete(id);
  }

  // Auto-assignment logic
  private async autoAssignModulesAndTrainers(groupId: string): Promise<void> {
    const group = this.trainingGroups.get(groupId);
    if (!group) return;

    const activeModules = Array.from(this.modules.values()).filter(m => m.isActive);
    const activeTrainers = Array.from(this.trainers.values()).filter(t => t.isActive);
    const assignments = Array.from(this.moduleTrainerAssignments.values());

    // Sort modules by total hours (longer modules first for better planning)
    const sortedModules = activeModules.sort((a, b) => b.totalHours - a.totalHours);
    
    let currentWeek = 1;
    const groupStartDate = new Date(group.startDate);
    
    // Create schedules for each module with weekly planning
    for (let i = 0; i < sortedModules.length; i++) {
      const module = sortedModules[i];
      
      // Find a trainer who can teach this module
      const availableTrainers = activeTrainers.filter(trainer => {
        const assignment = assignments.find(a => a.moduleId === module.id && a.trainerId === trainer.id);
        return assignment?.canTeach || trainer.specialties?.some(spec => 
          module.name.toLowerCase().includes(spec.toLowerCase()) ||
          spec.toLowerCase().includes(module.name.toLowerCase()) ||
          (module.type === 'practical' && spec.toLowerCase().includes('pratique')) ||
          (module.type === 'theoretical' && spec.toLowerCase().includes('théorique'))
        );
      });

      // Select trainer with lowest current workload
      const selectedTrainer = availableTrainers.reduce((best, current) => {
        if (!best) return current;
        return current.currentHoursPerWeek < best.currentHoursPerWeek ? current : best;
      }, null as Trainer | null);

      if (selectedTrainer) {
        // Calculate module duration in weeks
        const weeklyHours = Number(module.hoursPerSession) * module.sessionsPerWeek;
        const moduleDurationWeeks = Math.ceil(module.totalHours / weeklyHours);
        
        // Calculate start and end dates for this module
        const moduleStartDate = new Date(groupStartDate);
        moduleStartDate.setDate(moduleStartDate.getDate() + (currentWeek - 1) * 7);
        
        const moduleEndDate = new Date(moduleStartDate);
        moduleEndDate.setDate(moduleEndDate.getDate() + (moduleDurationWeeks * 7) - 1);

        // Create group module schedule with detailed planning
        const scheduleId = randomUUID();
        const schedule: GroupModuleSchedule = {
          id: scheduleId,
          groupId: groupId,
          moduleId: module.id,
          trainerId: selectedTrainer.id,
          scheduledOrder: i + 1,
          startDate: moduleStartDate,
          endDate: moduleEndDate,
          progress: 0,
          hoursCompleted: "0",
          status: "planned"
        };
        this.groupModuleSchedules.set(scheduleId, schedule);

        // Update trainer workload
        selectedTrainer.currentHoursPerWeek += weeklyHours;
        this.trainers.set(selectedTrainer.id, selectedTrainer);

        // Create module-trainer assignment if it doesn't exist
        const existingAssignment = assignments.find(a => 
          a.moduleId === module.id && a.trainerId === selectedTrainer.id
        );
        if (!existingAssignment) {
          const assignmentId = randomUUID();
          const assignment: ModuleTrainerAssignment = {
            id: assignmentId,
            moduleId: module.id,
            trainerId: selectedTrainer.id,
            canTeach: true
          };
          this.moduleTrainerAssignments.set(assignmentId, assignment);
        }
        
        // Move to next week for next module
        currentWeek += moduleDurationWeeks;
      }
    }
    
    // Update group estimated end date based on module planning
    if (currentWeek > 1) {
      const estimatedEndDate = new Date(groupStartDate);
      estimatedEndDate.setDate(estimatedEndDate.getDate() + (currentWeek - 1) * 7);
      group.estimatedEndDate = estimatedEndDate;
      this.trainingGroups.set(groupId, group);
    }
  }

  // Update trainer workload when schedules change
  private async updateTrainerWorkload(): Promise<void> {
    // Reset all trainer workloads
    for (const trainer of this.trainers.values()) {
      trainer.currentHoursPerWeek = 0;
    }

    // Recalculate based on active schedules
    const activeSchedules = Array.from(this.groupModuleSchedules.values())
      .filter(s => s.status === 'active' || s.status === 'planned');

    for (const schedule of activeSchedules) {
      const trainer = this.trainers.get(schedule.trainerId);
      const module = this.modules.get(schedule.moduleId);
      
      if (trainer && module) {
        const weeklyHours = Number(module.hoursPerSession) * module.sessionsPerWeek;
        trainer.currentHoursPerWeek += weeklyHours;
        this.trainers.set(trainer.id, trainer);
      }
    }
  }

  // Capacity calculations
  async calculateTrainerWorkload(): Promise<Array<{trainerId: string, name: string, currentHours: number, maxHours: number, occupationRate: number}>> {
    await this.updateTrainerWorkload();
    const trainers = await this.getAllTrainers();
    
    return trainers.map(trainer => {
      const occupationRate = trainer.maxHoursPerWeek > 0 ? (trainer.currentHoursPerWeek / trainer.maxHoursPerWeek) * 100 : 0;

      return {
        trainerId: trainer.id,
        name: trainer.name,
        currentHours: trainer.currentHoursPerWeek,
        maxHours: trainer.maxHoursPerWeek,
        occupationRate: Math.round(occupationRate)
      };
    });
  }

  async calculateRoomOccupancy(): Promise<Array<{roomId: string, name: string, occupiedHours: number, availableHours: number, occupationRate: number}>> {
    const rooms = await this.getAllRooms();
    const groups = await this.getAllTrainingGroups();
    const schedules = await this.getGroupModuleSchedules();
    
    const workingHoursPerWeek = 40; // Assumption: 40 hours per week availability

    return rooms.map(room => {
      const roomGroups = groups.filter(g => g.roomId === room.id && (g.status === 'active' || g.status === 'planned'));
      const occupiedHours = roomGroups.reduce((total, group) => {
        const groupSchedules = schedules.filter(s => s.groupId === group.id && (s.status === 'active' || s.status === 'planned'));
        return total + groupSchedules.reduce((scheduleTotal, schedule) => {
          const module = this.modules.get(schedule.moduleId);
          if (module) {
            return scheduleTotal + (Number(module.hoursPerSession) * module.sessionsPerWeek);
          }
          return scheduleTotal;
        }, 0);
      }, 0);

      const occupationRate = workingHoursPerWeek > 0 ? (occupiedHours / workingHoursPerWeek) * 100 : 0;

      return {
        roomId: room.id,
        name: room.name,
        occupiedHours,
        availableHours: workingHoursPerWeek,
        occupationRate: Math.round(occupationRate)
      };
    });
  }

  // Get detailed capacity analysis
  async getCapacityAnalysis(): Promise<{
    trainerConstraints: Array<{trainerId: string, name: string, isOverloaded: boolean, availableHours: number}>;
    roomConstraints: Array<{roomId: string, name: string, type: string, isOverbooked: boolean, availableCapacity: number}>;
    groupAssignments: Array<{groupId: string, groupName: string, assignedModules: number, assignedTrainers: number, hasRoom: boolean}>;
    weeklyPlanning: Array<{
      week: number;
      startDate: string;
      endDate: string;
      groups: Array<{
        groupId: string;
        groupName: string;
        modules: Array<{
          moduleId: string;
          moduleName: string;
          trainerId: string;
          trainerName: string;
          weeklyHours: number;
          totalHours: number;
          type: string;
        }>;
      }>;
      trainerWorkload: Array<{trainerId: string, name: string, weeklyHours: number}>;
      roomOccupancy: Array<{roomId: string, name: string, occupiedHours: number}>;
    }>;
    monthlyPlanning: Array<{
      month: number;
      year: number;
      monthName: string;
      totalGroups: number;
      totalTrainerHours: number;
      totalRoomHours: number;
      conflicts: Array<{type: string, description: string}>;
    }>;
    recommendations: string[];
  }> {
    const trainerWorkload = await this.calculateTrainerWorkload();
    const roomOccupancy = await this.calculateRoomOccupancy();
    const groups = await this.getAllTrainingGroups();
    const schedules = await this.getGroupModuleSchedules();

    const trainerConstraints = trainerWorkload.map(tw => ({
      trainerId: tw.trainerId,
      name: tw.name,
      isOverloaded: tw.occupationRate > 100,
      availableHours: Math.max(0, tw.maxHours - tw.currentHours)
    }));

    const roomConstraints = roomOccupancy.map(ro => ({
      roomId: ro.roomId,
      name: ro.name,
      type: this.rooms.get(ro.roomId)?.type || 'unknown',
      isOverbooked: ro.occupationRate > 100,
      availableCapacity: Math.max(0, ro.availableHours - ro.occupiedHours)
    }));

    const groupAssignments = groups.map(group => {
      const groupSchedules = schedules.filter(s => s.groupId === group.id);
      const uniqueTrainers = new Set(groupSchedules.map(s => s.trainerId));
      
      return {
        groupId: group.id,
        groupName: group.name,
        assignedModules: groupSchedules.length,
        assignedTrainers: uniqueTrainers.size,
        hasRoom: !!group.roomId
      };
    });

    const recommendations: string[] = [];
    
    // Generate recommendations
    const overloadedTrainers = trainerConstraints.filter(tc => tc.isOverloaded);
    if (overloadedTrainers.length > 0) {
      recommendations.push(`${overloadedTrainers.length} formateur(s) en surcharge - redistribuer les modules`);
    }

    const overbookedRooms = roomConstraints.filter(rc => rc.isOverbooked);
    if (overbookedRooms.length > 0) {
      recommendations.push(`${overbookedRooms.length} salle(s) surbookée(s) - revoir la planification`);
    }

    const unassignedGroups = groupAssignments.filter(ga => ga.assignedModules === 0);
    if (unassignedGroups.length > 0) {
      recommendations.push(`${unassignedGroups.length} groupe(s) sans modules assignés`);
    }

    const groupsWithoutRooms = groupAssignments.filter(ga => !ga.hasRoom);
    if (groupsWithoutRooms.length > 0) {
      recommendations.push(`${groupsWithoutRooms.length} groupe(s) sans salle assignée`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Capacité optimale - possibilité de lancer de nouveaux groupes");
    }

    // Generate weekly planning
    const weeklyPlanning = await this.generateWeeklyPlanning();
    
    // Generate monthly planning
    const monthlyPlanning = await this.generateMonthlyPlanning();
    return {
      trainerConstraints,
      roomConstraints,
      groupAssignments,
      weeklyPlanning,
      monthlyPlanning,
      recommendations
    };
  }

  // Generate detailed weekly planning
  private async generateWeeklyPlanning(): Promise<Array<{
    week: number;
    startDate: string;
    endDate: string;
    weekNumber: number;
    monthName: string;
    groups: Array<{
      groupId: string;
      groupName: string;
       roomName: string;
       participantCount: number;
      modules: Array<{
        moduleId: string;
        moduleName: string;
        trainerId: string;
        trainerName: string;
        weeklyHours: number;
        totalHours: number;
        type: string;
        progress: number;
        scheduledOrder: number;
      }>;
    }>;
    trainerWorkload: Array<{trainerId: string, name: string, weeklyHours: number}>;
    roomOccupancy: Array<{roomId: string, name: string, occupiedHours: number}>;
  }>> {
    const schedules = await this.getGroupModuleSchedules();
    const groups = await this.getAllTrainingGroups();
    const modules = await this.getAllModules();
    const trainers = await this.getAllTrainers();
    const rooms = await this.getAllRooms();
    
    const weeklyData = new Map<number, any>();
    const currentDate = new Date();
    
    // Process each schedule to build weekly view
    schedules.forEach(schedule => {
      if (!schedule.startDate || !schedule.endDate) return;
      
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const group = groups.find(g => g.id === schedule.groupId);
      const module = modules.find(m => m.id === schedule.moduleId);
      const trainer = trainers.find(t => t.id === schedule.trainerId);
      const room = rooms.find(r => r.id === group?.roomId);
      
      if (!group || !module || !trainer) return;
      
      // Calculate weeks covered by this module
      const weeklyHours = Number(module.hoursPerSession) * module.sessionsPerWeek;
      const moduleDurationWeeks = Math.ceil(module.totalHours / weeklyHours);
      
      for (let week = 0; week < moduleDurationWeeks; week++) {
        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(weekStartDate.getDate() + week * 7);
        
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        
        const weekNumber = Math.floor((weekStartDate.getTime() - new Date(group.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const actualWeekNumber = Math.floor((weekStartDate.getTime() - currentDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const monthName = weekStartDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        if (!weeklyData.has(weekNumber)) {
          weeklyData.set(weekNumber, {
            week: weekNumber,
            weekNumber: actualWeekNumber,
            monthName: monthName,
            startDate: weekStartDate.toISOString().split('T')[0],
            endDate: weekEndDate.toISOString().split('T')[0],
            groups: new Map(),
            trainerWorkload: new Map(),
            roomOccupancy: new Map()
          });
        }
        
        const weekData = weeklyData.get(weekNumber);
        
        // Add group module data
        if (!weekData.groups.has(group.id)) {
          weekData.groups.set(group.id, {
            groupId: group.id,
            groupName: group.name,
            roomName: room?.name || 'Non assigné',
            participantCount: group.participantCount,
            modules: []
          });
        }
        
        weekData.groups.get(group.id).modules.push({
          moduleId: module.id,
          moduleName: module.name,
          trainerId: trainer.id,
          trainerName: trainer.name,
          weeklyHours: weeklyHours,
          totalHours: module.totalHours,
          type: module.type,
          progress: schedule.progress || 0,
          scheduledOrder: schedule.scheduledOrder
        });
        
        // Update trainer workload for this week
        const currentTrainerHours = weekData.trainerWorkload.get(trainer.id) || 0;
        weekData.trainerWorkload.set(trainer.id, currentTrainerHours + weeklyHours);
        
        // Update room occupancy for this week
        if (group.roomId) {
          const room = rooms.find(r => r.id === group.roomId);
          if (room) {
            const currentRoomHours = weekData.roomOccupancy.get(room.id) || 0;
            weekData.roomOccupancy.set(room.id, currentRoomHours + weeklyHours);
          }
        }
      }
    });
    
    // Convert maps to arrays and sort by week
    return Array.from(weeklyData.values())
      .sort((a, b) => a.week - b.week)
      .map(weekData => ({
        ...weekData,
        groups: Array.from(weekData.groups.values()),
        trainerWorkload: Array.from(weekData.trainerWorkload.entries()).map(([trainerId, hours]) => {
          const trainer = trainers.find(t => t.id === trainerId);
          return {
            trainerId,
            name: trainer?.name || 'Unknown',
            weeklyHours: hours
          };
        }),
        roomOccupancy: Array.from(weekData.roomOccupancy.entries()).map(([roomId, hours]) => {
          const room = rooms.find(r => r.id === roomId);
          return {
            roomId,
            name: room?.name || 'Unknown',
            occupiedHours: hours
          };
        })
      }));
  }

  // Generate monthly planning summary
  private async generateMonthlyPlanning(): Promise<Array<{
    month: number;
    year: number;
    monthName: string;
    totalGroups: number;
    totalTrainerHours: number;
    totalRoomHours: number;
    conflicts: Array<{type: string, description: string}>;
  }>> {
    const groups = await this.getAllTrainingGroups();
    const schedules = await this.getGroupModuleSchedules();
    const trainers = await this.getAllTrainers();
    const rooms = await this.getAllRooms();
    
    const monthlyData = new Map<string, any>();
    const currentDate = new Date();
    
    // Generate data for next 12 months
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthKey = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
      
      monthlyData.set(monthKey, {
        month: targetDate.getMonth(),
        year: targetDate.getFullYear(),
        monthName: targetDate.toLocaleDateString('fr-FR', { month: 'long' }),
        totalGroups: 0,
        totalTrainerHours: 0,
        totalRoomHours: 0,
        conflicts: []
      });
    }
    
    // Process schedules to calculate monthly data
    schedules.forEach(schedule => {
      if (!schedule.startDate || !schedule.endDate) return;
      
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const group = groups.find(g => g.id === schedule.groupId);
      const module = this.modules.get(schedule.moduleId);
      
      if (!group || !module) return;
      
      // Check which months this schedule overlaps
      for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthData = monthlyData.get(monthKey);
        
        if (monthData) {
          monthData.totalGroups++;
          const weeklyHours = Number(module.hoursPerSession) * module.sessionsPerWeek;
          monthData.totalTrainerHours += weeklyHours * 4; // Approximate 4 weeks per month
          monthData.totalRoomHours += weeklyHours * 4;
        }
      }
    });
    
    // Detect conflicts for each month
    monthlyData.forEach((monthData, monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      
      // Check trainer conflicts
      const maxTrainerCapacity = trainers.reduce((sum, t) => sum + t.maxHoursPerWeek * 4, 0);
      if (monthData.totalTrainerHours > maxTrainerCapacity) {
        monthData.conflicts.push({
          type: 'trainer',
          description: `Surcharge formateurs: ${monthData.totalTrainerHours}h requis vs ${maxTrainerCapacity}h disponibles`
        });
      }
      
      // Check room conflicts
      const maxRoomCapacity = rooms.length * 40 * 4; // 40h per week per room, 4 weeks
      if (monthData.totalRoomHours > maxRoomCapacity) {
        monthData.conflicts.push({
          type: 'room',
          description: `Surcharge salles: ${monthData.totalRoomHours}h requis vs ${maxRoomCapacity}h disponibles`
        });
      }
    });
    
    return Array.from(monthlyData.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }
}

export const storage = new MemStorage();
