import { env } from "@/config/env";
import { init } from "@paralleldrive/cuid2";

export const cuid2 = init({
  random: Math.random,
  length: 9,
  fingerprint: env.TICKET_SIGNING_SECRET,
});
