import { Request } from "express";
import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export type AuthenticatedRequest = Request & { user: AuthUser };
