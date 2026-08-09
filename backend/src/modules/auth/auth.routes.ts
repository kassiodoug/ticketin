import { Router } from "express";
import * as authService from "./auth.service";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ error: "name, email, password e role são obrigatórios" });
  }
  if (!["ORGANIZER", "CLIENT", "GATE"].includes(role)) {
    return res.status(400).json({ error: "role inválida" });
  }
  try {
    const user = await authService.register(name, email, password, role);
    return res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "e-mail já cadastrado" });
    }
    throw err;
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "email e password são obrigatórios" });
  }
  const result = await authService.login(email, password);
  if (!result) {
    return res.status(401).json({ error: "credenciais inválidas" });
  }
  return res.json(result);
});
