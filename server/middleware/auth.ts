import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { isStaff } from "../lib/permissions";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function requireStaff() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !isStaff(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function requireOwner() {
  return requireRole(Role.OWNER);
}

export async function canAccessProject(userId: string, role: Role, projectClientId: string): Promise<boolean> {
  if (isStaff(role)) return true;
  return userId === projectClientId;
}

export async function canAccessOrder(
  userId: string,
  role: Role,
  projectClientId: string
): Promise<boolean> {
  if (isStaff(role)) return true;
  return userId === projectClientId;
}
