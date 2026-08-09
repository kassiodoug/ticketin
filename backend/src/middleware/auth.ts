import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"
import { AuthUser, Role } from "../modules/auth/auth.service"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: "token ausente" })

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: "token inválido ou expirado" })
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "não autenticado" })
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: `acesso restrito a: ${roles.join(", ")}` })
    }
    next()
  }
}
