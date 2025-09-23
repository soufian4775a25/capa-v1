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

  // Capacity calculations
  async calculateTrainerWorkload(): Promise<Array<{trainerId: string, name: string, currentHours: number, maxHours: number, occupationRate: number}>> {
    const trainers = await this.getAllTrainers();
    const schedules = await this.getGroupModuleSchedules();
    
    return trainers.map(trainer => {
      const trainerSchedules = schedules.filter(s => s.trainerId === trainer.id && s.status === 'active');
      const currentHours = trainerSchedules.reduce((total, schedule) => {
        const module = this.modules.get(schedule.moduleId);
        if (module) {
          return total + (Number(module.hoursPerSession) * module.sessionsPerWeek);
        }
        return total;
      }, 0);

      const occupationRate = trainer.maxHoursPerWeek > 0 ? (currentHours / trainer.maxHoursPerWeek) * 100 : 0;

      return {
        trainerId: trainer.id,
        name: trainer.name,
        currentHours,
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
      const roomGroups = groups.filter(g => g.roomId === room.id && g.status === 'active');
      const occupiedHours = roomGroups.reduce((total, group) => {
        const groupSchedules = schedules.filter(s => s.groupId === group.id && s.status === 'active');
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
}

export const storage = new MemStorage();
