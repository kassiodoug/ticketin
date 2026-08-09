/**
 * Popula o banco com os dados de teste exigidos pelo desafio:
 * 1 organizador, 2 clientes, 1 usuário de portaria e 1 evento publicado
 * com assentos disponíveis.
 *
 * Rodar com: npm run seed
 */
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { pool } from "./pool"

async function hash(pw: string) {
  return bcrypt.hash(pw, 10)
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Limpa dados anteriores (ambiente de teste/dev apenas)
    await client.query(
      "TRUNCATE tickets, reservation_seats, reservations, seats, events, users RESTART IDENTITY CASCADE"
    )

    const organizerId = randomUUID()
    const client1Id = randomUUID()
    const client2Id = randomUUID()
    const gateId = randomUUID()

    const users = [
      [
        organizerId,
        "Ana Organizadora",
        "organizador@evento.test",
        await hash("senha123"),
        "ORGANIZER",
      ],
      [
        client1Id,
        "Bruno Cliente",
        "cliente1@evento.test",
        await hash("senha123"),
        "CLIENT",
      ],
      [
        client2Id,
        "Carla Cliente",
        "cliente2@evento.test",
        await hash("senha123"),
        "CLIENT",
      ],
      [
        gateId,
        "Diego Portaria",
        "portaria@evento.test",
        await hash("senha123"),
        "GATE",
      ],
    ]

    for (const [id, name, email, password_hash, role] of users) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5)`,
        [id, name, email, password_hash, role]
      )
    }

    const eventId = randomUUID()
    const seatRows = 5
    const seatCols = 8
    const capacity = seatRows * seatCols

    await client.query(
      `INSERT INTO events
        (id, organizer_id, source, external_id, title, description, image_url,
         venue_name, venue_address, starts_at, price_cents, capacity, seat_rows, seat_cols, published)
       VALUES ($1,$2,'MANUAL',NULL,$3,$4,$5,$6,$7, now() + interval '14 days', $8,$9,$10,$11, true)`,
      [
        eventId,
        organizerId,
        "Noite de Cinema: Sessão Especial",
        "Evento de teste semeado automaticamente para avaliação do desafio.",
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
        "Cine Elite - Sala 3",
        "Av. Principal, 1000",
        3500,
        capacity,
        seatRows,
        seatCols,
      ]
    )

    const rowLabels = ["A", "B", "C", "D", "E"]
    for (const row of rowLabels) {
      for (let col = 1; col <= seatCols; col++) {
        await client.query(
          `INSERT INTO seats (event_id, row_label, col_number, status) VALUES ($1,$2,$3,'AVAILABLE')`,
          [eventId, row, col]
        )
      }
    }

    await client.query("COMMIT")

    console.log("Seed concluído. Usuários de teste:")
    console.table([
      {
        papel: "ORGANIZER",
        email: "organizador@evento.test",
        senha: "senha123",
      },
      { papel: "CLIENT", email: "cliente1@evento.test", senha: "senha123" },
      { papel: "CLIENT", email: "cliente2@evento.test", senha: "senha123" },
      { papel: "GATE", email: "portaria@evento.test", senha: "senha123" },
    ])
    console.log(`Evento semeado: ${eventId} (${capacity} assentos disponíveis)`)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Falha no seed:", err)
  process.exit(1)
})
