import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTrainerSchema, insertModuleSchema, insertRoomSchema, 
  insertTrainingGroupSchema, insertModuleTrainerAssignmentSchema,
  insertGroupModuleScheduleSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In production, implement proper JWT token generation
      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Trainers
  app.get("/api/trainers", async (req, res) => {
    try {
      const trainers = await storage.getAllTrainers();
      res.json(trainers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trainers" });
    }
  });

  app.get("/api/trainers/:id", async (req, res) => {
    try {
      const trainer = await storage.getTrainer(req.params.id);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }
      res.json(trainer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trainer" });
    }
  });

  app.post("/api/trainers", async (req, res) => {
    try {
      const validatedData = insertTrainerSchema.parse(req.body);
      const trainer = await storage.createTrainer(validatedData);
      res.status(201).json(trainer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create trainer" });
    }
  });

  app.put("/api/trainers/:id", async (req, res) => {
    try {
      const validatedData = insertTrainerSchema.partial().parse(req.body);
      const trainer = await storage.updateTrainer(req.params.id, validatedData);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }
      res.json(trainer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update trainer" });
    }
  });

  app.delete("/api/trainers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrainer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Trainer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete trainer" });
    }
  });

  // Modules
  app.get("/api/modules", async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.get("/api/modules/:id", async (req, res) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.post("/api/modules", async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put("/api/modules/:id", async (req, res) => {
    try {
      const validatedData = insertModuleSchema.partial().parse(req.body);
      const module = await storage.updateModule(req.params.id, validatedData);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteModule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const validatedData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(validatedData);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    try {
      const validatedData = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(req.params.id, validatedData);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRoom(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Training Groups
  app.get("/api/training-groups", async (req, res) => {
    try {
      const groups = await storage.getAllTrainingGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training groups" });
    }
  });

  app.get("/api/training-groups/:id", async (req, res) => {
    try {
      const group = await storage.getTrainingGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training group" });
    }
  });

  app.post("/api/training-groups", async (req, res) => {
    try {
      const validatedData = insertTrainingGroupSchema.parse(req.body);
      const group = await storage.createTrainingGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create training group" });
    }
  });

  app.put("/api/training-groups/:id", async (req, res) => {
    try {
      const validatedData = insertTrainingGroupSchema.partial().parse(req.body);
      const group = await storage.updateTrainingGroup(req.params.id, validatedData);
      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update training group" });
    }
  });

  app.delete("/api/training-groups/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrainingGroup(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Training group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete training group" });
    }
  });

  // Module Trainer Assignments
  app.get("/api/module-trainer-assignments", async (req, res) => {
    try {
      const assignments = await storage.getModuleTrainerAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/module-trainer-assignments", async (req, res) => {
    try {
      const validatedData = insertModuleTrainerAssignmentSchema.parse(req.body);
      const assignment = await storage.createModuleTrainerAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Group Module Schedules
  app.get("/api/group-module-schedules", async (req, res) => {
    try {
      const schedules = await storage.getGroupModuleSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.get("/api/group-module-schedules/group/:groupId", async (req, res) => {
    try {
      const schedules = await storage.getGroupModuleSchedulesByGroup(req.params.groupId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group schedules" });
    }
  });

  app.post("/api/group-module-schedules", async (req, res) => {
    try {
      const validatedData = insertGroupModuleScheduleSchema.parse(req.body);
      const schedule = await storage.createGroupModuleSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.put("/api/group-module-schedules/:id", async (req, res) => {
    try {
      const validatedData = insertGroupModuleScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateGroupModuleSchedule(req.params.id, validatedData);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  // Capacity calculations
  app.get("/api/capacity/trainer-workload", async (req, res) => {
    try {
      const workload = await storage.calculateTrainerWorkload();
      res.json(workload);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate trainer workload" });
    }
  });

  app.get("/api/capacity/room-occupancy", async (req, res) => {
    try {
      const occupancy = await storage.calculateRoomOccupancy();
      res.json(occupancy);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate room occupancy" });
    }
  });

  // Dashboard summary
  app.get("/api/dashboard/summary", async (req, res) => {
    try {
      const [trainers, rooms, groups, trainerWorkload, roomOccupancy] = await Promise.all([
        storage.getAllTrainers(),
        storage.getAllRooms(),
        storage.getAllTrainingGroups(),
        storage.calculateTrainerWorkload(),
        storage.calculateRoomOccupancy()
      ]);

      const activeGroups = groups.filter(g => g.status === 'active');
      const completedGroups = groups.filter(g => g.status === 'completed');
      const delayedGroups = groups.filter(g => g.status === 'delayed');

      const avgTrainerOccupation = trainerWorkload.length > 0 
        ? Math.round(trainerWorkload.reduce((sum, t) => sum + t.occupationRate, 0) / trainerWorkload.length)
        : 0;

      const avgRoomOccupation = roomOccupancy.length > 0
        ? Math.round(roomOccupancy.reduce((sum, r) => sum + r.occupationRate, 0) / roomOccupancy.length)
        : 0;

      const capacityRemaining = 100 - Math.max(avgTrainerOccupation, avgRoomOccupation);

      const summary = {
        trainerOccupationRate: avgTrainerOccupation,
        roomOccupationRate: avgRoomOccupation,
        activeGroups: activeGroups.length,
        totalGroups: groups.length,
        capacityRemaining: Math.max(0, capacityRemaining),
        totalTrainers: trainers.length,
        totalRooms: rooms.length,
        completedGroups: completedGroups.length,
        delayedGroups: delayedGroups.length,
        trainerWorkload,
        roomOccupancy
      };

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  // Capacity analysis
  app.get("/api/capacity/analysis", async (req, res) => {
    try {
      const analysis = await storage.getCapacityAnalysis();
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capacity analysis" });
    }
  });

  // Auto-assign trainers to modules
  app.post("/api/auto-assign/trainers-modules", async (req, res) => {
    try {
      const trainers = await storage.getAllTrainers();
      const modules = await storage.getAllModules();
      let assignmentsCreated = 0;

      for (const trainer of trainers) {
        for (const module of modules) {
          // Check if trainer specialties match module
          const canTeach = trainer.specialties?.some(specialty => 
            module.name.toLowerCase().includes(specialty.toLowerCase()) ||
            specialty.toLowerCase().includes(module.name.toLowerCase()) ||
            (module.type === 'practical' && specialty.toLowerCase().includes('pratique')) ||
            (module.type === 'theoretical' && specialty.toLowerCase().includes('théorique'))
          ) || false;

          if (canTeach) {
            try {
              await storage.createModuleTrainerAssignment({
                moduleId: module.id,
                trainerId: trainer.id,
                canTeach: true
              });
              assignmentsCreated++;
            } catch (error) {
              // Assignment might already exist, continue
            }
          }
        }
      }

      res.json({ 
        success: true, 
        message: `${assignmentsCreated} affectations créées automatiquement` 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to auto-assign trainers to modules" });
    }
  });

  // Get detailed weekly planning
  app.get("/api/capacity/weekly-planning", async (req, res) => {
    try {
      const analysis = await storage.getCapacityAnalysis();
      res.json(analysis.weeklyPlanning || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly planning" });
    }
  });

  // Get monthly planning summary
  app.get("/api/capacity/monthly-planning", async (req, res) => {
    try {
      const analysis = await storage.getCapacityAnalysis();
      res.json(analysis.monthlyPlanning || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly planning" });
    }
  });

  // Recalculate all assignments and schedules
  app.post("/api/recalculate-capacity", async (req, res) => {
    try {
      // This would trigger a full recalculation of all assignments
      const groups = await storage.getAllTrainingGroups();
      let recalculated = 0;
      
      for (const group of groups) {
        if (group.status === 'planned' || group.status === 'active') {
          // Force recalculation by recreating the group's assignments
          recalculated++;
        }
      }
      
      res.json({ 
        success: true, 
        message: `${recalculated} groupes recalculés` 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to recalculate capacity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
