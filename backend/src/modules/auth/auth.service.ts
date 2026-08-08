import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool';
import { env } from '../../config/env';

export type Role = 'ORGANIZER' | 'CLIENT' | 'GATE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function register(name: string, email: string, password: string, role: Role) {
  const password_hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role`,
    [name, email, password_hash, role]
  );
  return result.rows[0] as AuthUser;
}

export async function login(email: string, password: string) {
  const result = await pool.query(
    `SELECT id, name, email, role, password_hash FROM users WHERE email = $1`,
    [email]
  );
  const row = result.rows[0];
  if (!row) return null;

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;

  const user: AuthUser = { id: row.id, name: row.name, email: row.email, role: row.role };
  const token = jwt.sign(user, env.JWT_SECRET, { expiresIn: '12h' });
  return { user, token };
}
