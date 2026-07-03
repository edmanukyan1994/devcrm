import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware, requireStaff, requireOwner, signToken } from "../middleware/auth";
import { paramId } from "../lib/params";
import { resolveRegistrationRoleAsync, isValidDeveloperInvite } from "../lib/roles";
import { isStaff } from "../lib/permissions";
import { ensureOwnerByEmail, userSelect } from "../lib/owner";

const router = Router();

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

    const staffCount = await prisma.user.count({
      where: { role: { in: [Role.OWNER, Role.DEVELOPER] } },
    });

    let userRole: Role;
    try {
      userRole = await resolveRegistrationRoleAsync(role, inviteCode, staffCount);
    } catch {
      res.status(403).json({ error: "Invalid developer invite code" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let user = await prisma.user.create({
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

    user = (await ensureOwnerByEmail(user.id, user.email)) ?? user;

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/become-developer", authMiddleware, async (req, res) => {
  try {
    if (isStaff(req.user!.role)) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: userSelect });
      res.json({ user, token: signToken({ id: user!.id, email: user!.email, role: user!.role }) });
      return;
    }

    const { inviteCode } = req.body;
    const staffCount = await prisma.user.count({
      where: { role: { in: [Role.OWNER, Role.DEVELOPER] } },
    });

    const canPromote =
      isValidDeveloperInvite(inviteCode) ||
      (staffCount === 0 && req.user!.role === Role.CLIENT);

    if (!canPromote) {
      res.status(403).json({ error: "Invalid developer invite code" });
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

    const found = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!found) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, found.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const updated = await ensureOwnerByEmail(found.id, found.email);
    const user =
      updated ??
      ({
        id: found.id,
        email: found.email,
        role: found.role,
        createdAt: found.createdAt,
        profile: found.profile,
      });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const found = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: userSelect,
    });

    if (!found) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = (await ensureOwnerByEmail(found.id, found.email)) ?? found;
    if (user.role !== req.user!.role) {
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      res.json({ user, token });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get("/users", authMiddleware, requireOwner(), async (req, res) => {
  try {
    const { role } = req.query;
    const where =
      role === "CLIENT"
        ? { role: Role.CLIENT }
        : role === "DEVELOPER"
          ? { role: Role.DEVELOPER }
          : role === "OWNER"
            ? { role: Role.OWNER }
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

router.get("/clients", authMiddleware, requireStaff(), async (req, res) => {
  try {
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

router.patch("/users/:id/role", authMiddleware, requireOwner(), async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== "OWNER" && role !== "DEVELOPER" && role !== "CLIENT") {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const targetId = paramId(req.params.id);
    if (targetId === req.user!.id && role !== Role.OWNER) {
      res.status(400).json({ error: "Cannot change your own role" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role: role as Role },
      select: userSelect,
    });

    res.json({ user });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.delete("/users/:id", authMiddleware, requireOwner(), async (req, res) => {
  try {
    const id = paramId(req.params.id);
    if (id === req.user!.id) {
      res.status(400).json({ error: "Cannot delete yourself" });
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("User delete error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
