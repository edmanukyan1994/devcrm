import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware, requireRole, signToken } from "../middleware/auth";
import { paramId } from "../lib/params";
import { resolveRegistrationRoleAsync, isValidDeveloperInvite } from "../lib/roles";

const router = Router();

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  profile: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      phone: true,
      avatar: true,
    },
  },
};

router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, company, phone, role, inviteCode } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: "Email, password, first name, and last name are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const developerCount = await prisma.user.count({ where: { role: Role.DEVELOPER } });

    let userRole: Role;
    try {
      userRole = await resolveRegistrationRoleAsync(role, inviteCode, developerCount);
    } catch {
      res.status(403).json({ error: "Invalid developer invite code" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
        profile: {
          create: {
            firstName,
            lastName,
            company: company || null,
            phone: phone || null,
          },
        },
      },
      select: userSelect,
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/become-developer", authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const developerCount = await prisma.user.count({ where: { role: Role.DEVELOPER } });

    const canPromote =
      isValidDeveloperInvite(inviteCode) ||
      (developerCount === 0 && req.user!.role === Role.CLIENT);

    if (!canPromote) {
      res.status(403).json({ error: "Invalid developer invite code" });
      return;
    }

    if (req.user!.role === Role.DEVELOPER) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: userSelect });
      res.json({ user, token: signToken({ id: user!.id, email: user!.email, role: user!.role }) });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { role: Role.DEVELOPER },
      select: userSelect,
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (error) {
    console.error("Become developer error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const { password: _, ...safeUser } = user;
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ user: safeUser, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: userSelect,
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get("/users", authMiddleware, requireRole(Role.DEVELOPER), async (req, res) => {
  try {
    const { role } = req.query;
    const where =
      role === "CLIENT"
        ? { role: Role.CLIENT }
        : role === "DEVELOPER"
          ? { role: Role.DEVELOPER }
          : {};

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    });

    res.json({ users });
  } catch (error) {
    console.error("Users list error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/clients", authMiddleware, async (req, res) => {
  try {
    if (req.user!.role !== Role.DEVELOPER) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const clients = await prisma.user.findMany({
      where: { role: Role.CLIENT },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    res.json({ clients });
  } catch (error) {
    console.error("Clients error:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.patch("/users/:id/role", authMiddleware, requireRole(Role.DEVELOPER), async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== "DEVELOPER" && role !== "CLIENT") {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: paramId(req.params.id) },
      data: { role: role as Role },
      select: userSelect,
    });

    res.json({ user });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;
