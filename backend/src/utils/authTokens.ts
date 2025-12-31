import jwt from "jsonwebtoken";
import { env } from "../env";

export function signAccessToken(userId: string) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "2h" });
}
