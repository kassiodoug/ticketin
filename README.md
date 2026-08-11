# TicketIn

Plataforma para eventos e ingressos: onde organizador e cliente se encontram.
Projeto participando do processo seletivo do Projeto de Desenvolvimento ELITE DEV | Desenvolvedor Full Stack Jr na Verzel.

## Como rodar o projeto

### 1. Configurando .env do back-end, a partir da pasta raiz execute os seguintes comandos:

```bash
cd backend
cp .env.example .env
```

E insira valores para as variáveis JWT_SECRET, TICKET_SIGNING_SECRET, TICKETMASTER_API_KEY e TMDB_API_KEY no arquivo .env.

### 2. Configurando .env do front-end, a partir da pasta raiz execute os seguintes comandos:

```bash
cd frontend
cp .env.example .env
```

### 3. Gerando containers:

Basta rodar o comando abaixo para criar os containers:

```bash
docker compose up -d
```

E depois rodar os comandos:

```bash
docker exec backend npm run migrate
```

e

```bash
docker exec backend npm run seed
```

## Testes do back-end são executados com o comando:

```bash
npm test
```

OBS.: O teste de concorrência de assentos (`tests/reservations.integration.test.ts`)
só roda se `DATABASE_URL` estiver definida; ele é
pulado automaticamente caso contrário, para não quebrar `npm test` num
ambiente sem banco configurado.

## Login com os dados semeados

| Papel       | E-mail                  | Senha    |
| ----------- | ----------------------- | -------- |
| Organizador | organizador@evento.test | senha123 |
| Cliente     | cliente1@evento.test    | senha123 |
| Cliente     | cliente2@evento.test    | senha123 |
| Portaria    | portaria@evento.test    | senha123 |

O seed também cria um evento publicado ("Noite de Cinema: Sessão
Especial") com 40 assentos disponíveis, para percorrer o fluxo inteiro
sem precisar montar nada do zero.

## Chaves de API externas

- Ticketmaster Discovery API: `https://developer.ticketmaster.com` (chave gratuita)
- TMDb API: `https://developer.themoviedb.org` (chave gratuita, "API Read Access Token")

Sem as chaves, o resto da aplicação funciona normalmente — só a busca no
catálogo externo (usada pelo organizador para criar um evento) fica
indisponível. O evento semeado (`MANUAL`) não depende delas.

## Fluxo de ponta a ponta para testar

1. Login como **organizador** → Painel → buscar um show/filme → configurar
   local, data, preço e o tamanho do mapa de assentos → publicar.
2. Login como **cliente** (em outra aba/navegador anônimo) → escolher o
   evento → selecionar assento(s) no mapa → reservar → simular pagamento
   (aprovado ou recusado).
3. Em "Meus ingressos", abrir o QR e copiar o link de compartilhamento.
4. Login como **portaria** → ativar câmera (ou digitar o código
   manualmente) → validar. Tentar validar o mesmo ingresso de novo para
   ver o retorno "já utilizado".

## Stack

- O projeto todo foi feito com TypeScript;

### Front-end

- Next.js/React;

### Back-end

- Node.js/Express.

## Como a IA (Claude) foi usada?

- Geração da estrutura inicial do projeto, como: schema do banco de dados, rotas do back-end e páginas do front-end;
- Estrutura inicial do back-end (Express);
- Criação de testes automatizados com Jest;
- Criação e configuração dos arquivos Docker;

## Estrutura de pastas e arquivos

```
backend/
  src/
    modules/        # auth, catalog, events, reservations, tickets, gate
    db/              # schema.sql, seed.ts, pool.ts
    middleware/      # requireAuth, requireRole
    utils/           # ticketCode.ts (HMAC do QR)
  tests/
frontend/
  src/
    app/             # rotas (App Router) — uma pasta por fluxo do desafio
    context/         # AuthContext
    api/             # cliente HTTP fino
    components/      # Topbar, RequireRole
```
