import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.use(cors()); // Libera o CORS para todas as rotas
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_desenvolvimento";

// O projeto usa "type": "module" no package.json, ou seja, roda como ESM.
// Nesse modo não existe a variável __dirname que o Node antigo oferecia: o
// caminho do arquivo atual precisa ser reconstruído a partir de
// import.meta.url, e é o que o fileURLToPath faz por nós.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Pasta que o `npm run build` do Vite cria dentro de web/. */
const FRONT_DIST = path.join(__dirname, "web", "dist");

/** O arquivo de entrada que o SPA fallback entrega. */
const FRONT_INDEX = path.join(FRONT_DIST, "index.html");

/**
 * Resposta que aparece quando alguém abre a página e a pasta web/dist ainda
 * não existe. Um erro de "Cannot GET /" não ajuda ninguém a descobrir que
 * faltou um `npm run build`, então a mensagem diz exatamente o que fazer.
 */
const SEM_BUILD = [
    "Ainda não existe o build do front-end.",
    "",
    "Procurei este arquivo:",
    `  ${FRONT_INDEX}`,
    "",
    "Gere-o com:",
    "  cd web",
    "  npm install",
    "  npm run build",
    "",
    "Enquanto isso, a API continua funcionando em /api/health.",
].join("\n");

/**
 * Devolve a data de modificação mais recente de uma pasta, olhando dentro das
 * subpastas também. Serve para comparar os fontes do front com o build.
 */
function maisRecente(dir: string): number {
    let maior = 0;

    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const caminho = path.join(dir, entrada.name);

        if (entrada.isDirectory()) {
            maior = Math.max(maior, maisRecente(caminho));
        } else {
            maior = Math.max(maior, fs.statSync(caminho).mtimeMs);
        }
    }

    return maior;
}

// 1. Criamos um "molde" (Interface) para nossas tarefas e usuários
// (atualizado conforme TODO_09 Aula 09)
interface Tarefa {
    id: number;
    usuario_id: number;
    titulo: string;
    descricao: string | null;
    status: "pending" | "completed";
    prioridade: "low" | "medium" | "high";
    criado_em: string;
    atualizado_em: string;
}

interface Usuario {
    id: number;
    email: string;
    senha_hash: string;
    criado_em: string;
}

interface AuthRequest extends Request {
    usuarioId?: number; // Injetaremos o ID aqui após validar o token
}

// 2. Centralizamos as regras. Se a regra mudar, mudamos em um só lugar!
const PRIORIDADES = ["low", "medium", "high"] as const;
const STATUS_VALIDOS = ["pending", "completed"] as const;

// 3. Funções ajudantes (Helpers). Escrevemos a validação uma vez e usamos em todo lugar.
const tituloValido = (t: unknown): t is string =>
    typeof t === "string" && t.trim().length >= 3;

const normalizarPrioridade = (p: unknown) => {
    const listaPrioridades = PRIORIDADES as readonly string[];

    return typeof p === "string" && listaPrioridades.includes(p)
        ? p
        : "medium";
};

const normalizarStatus = (s: unknown) => {
    const listaStatus = STATUS_VALIDOS as readonly string[];

    return typeof s === "string" && listaStatus.includes(s)
        ? s
        : "pending";
};

// 4. Um ajudante só para transformar e validar IDs
const parsearId = (idParam: string): number | null => {
    const id = Number(idParam);
    // Number("12abc") vira NaN imediatamente, o que é mais seguro!
    return isNaN(id) ? null : id;
};

// Middleware para ler o corpo das requisições em formato JSON
app.use(express.json());

// ============================================================================
// TODO_09 — Passo 2 e 3: Leitura do .env com detecção de BOM
// ============================================================================
const ARQUIVO_ENV = path.join(__dirname, ".env");

function carregarEnv(): void {
    if (!fs.existsSync(ARQUIVO_ENV)) return;

    const bruto = fs.readFileSync(ARQUIVO_ENV);
    if (bruto.length >= 3 && bruto[0] === 0xef && bruto[1] === 0xbb && bruto[2] === 0xbf) {
        console.warn(
            "\n[ATENÇÃO] O seu .env foi salvo COM BOM (marca de bytes 0xEF 0xBB 0xBF).\n" +
            "          Consequência: a PRIMEIRA variável do arquivo é ignorada sem erro.\n" +
            "          Salve de novo em UTF-8 SEM BOM e confira se a primeira\n" +
            "          variável é mesmo a TURSO_URL.\n",
        );
    }
    // Quem já estiver no ambiente do sistema (ex: container Docker/Render) tem prioridade
    process.loadEnvFile(ARQUIVO_ENV);
}

carregarEnv();

// ============================================================================
// TODO_09 — Passo 4: Conexão com o banco e Banner informativo
// ============================================================================
const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

const usandoNuvem = Boolean(TURSO_URL && TURSO_TOKEN);
const MODO_BANCO = usandoNuvem ? "Turso / libSQL (nuvem)" : "arquivo local (SQLite)";

// Se houver URL e Token, conecta no Turso; senão, mantém arquivo local como fallback
const db = createClient({
    url: usandoNuvem ? TURSO_URL! : "file:./tarefas.db",
    authToken: usandoNuvem ? TURSO_TOKEN : undefined,
});

/**
 * Exibe no terminal o modo em que o banco está operando, sem adivinhações.
 */
function exibirBannerBanco(): void {
    console.log("============================================================");
    console.log("  Banco de dados");
    console.log("------------------------------------------------------------");
    console.log(`  Modo  : ${MODO_BANCO}`);
    console.log(`  Onde  : ${usandoNuvem ? TURSO_URL : path.resolve("tarefas.db")}`);
    console.log(`  Token : ${usandoNuvem ? "presente (nunca será mostrado)" : "não informado"}`);
    if (!usandoNuvem) {
        console.log("  Para usar o Turso, crie um arquivo .env na raiz com:");
        console.log("    TURSO_URL=libsql://seu-banco.turso.io");
        console.log("    TURSO_TOKEN=seu-token");
    }
    console.log("============================================================");
}

// ============================================================================
// TODO_09 — Passo 5: Inicialização do Schema com db.batch()
// ============================================================================
const SQL_USUARIOS = `
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`;

const SQL_TAREFAS = `
    CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        descricao TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        prioridade TEXT NOT NULL DEFAULT 'medium',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    );
`;

async function inicializarBanco(): Promise<void> {
    try {
        // O batch é atômico: executa múltiplos statements e reverte tudo se um falhar
        await db.batch([SQL_USUARIOS, SQL_TAREFAS], "write");

        // Garante que a coluna atualizado_em existe (bancos criados pela Aula 08 não têm)
        try {
            await db.execute({
                sql: "ALTER TABLE tarefas ADD COLUMN atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP",
            });
            console.log("  Coluna atualizado_em adicionada com sucesso.");
        } catch (alterErro: any) {
            if (String(alterErro?.message).includes("duplicate column")) {
                console.log("  Coluna atualizado_em já existe.");
            } else {
                console.warn("  Não foi possível adicionar coluna atualizado_em:", alterErro?.message);
            }
        }

        // Usuário inicial padrão para facilitar o login em laboratório
        const adminEmail = "admin@senai.com";
        const { rows } = await db.execute({
            sql: "SELECT id FROM usuarios WHERE email = ?",
            args: [adminEmail],
        });

        if (rows.length === 0) {
            const senhaPadrao = "senha_super_secreta_123";
            const hash = await bcrypt.hash(senhaPadrao, 10);
            await db.execute({
                sql: "INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)",
                args: [adminEmail, hash],
            });
        }
    } catch (erro: any) {
        console.error("\n[ERRO] Não consegui preparar o banco de dados.");
        console.error(`  Modo   : ${MODO_BANCO}`);
        console.error(`  Onde   : ${usandoNuvem ? TURSO_URL : path.resolve("tarefas.db")}`);
        console.error(`  Código : ${erro?.code || "DESCONHECIDO"}`);
        console.error(`  Detalhe: ${erro?.message}`);
        if (usandoNuvem) {
            console.error("  O Turso devolve HTTP 404 tanto para URL errada quanto para token errado.");
            console.error("  Confira se a TURSO_URL não tem barra no final e se o TURSO_TOKEN está completo.\n");
        }
        process.exit(1);
    }
}

// ============================================================================
// TODO_09 — Passo 6: Helpers de consulta (síncrono → assíncrono)
// ============================================================================
function primeiraLinha<T>(rows: any[]): T | undefined {
    return rows[0] as T | undefined;
}

// Helpers assíncronos protegidos com queries parametrizadas (args)
const buscarUsuarioPorEmail = (email: string) =>
    db.execute({ sql: "SELECT * FROM usuarios WHERE email = ?", args: [email] });

const buscarUsuarioPorId = (id: number) =>
    db.execute({ sql: "SELECT id, email, criado_em FROM usuarios WHERE id = ?", args: [id] });

const inserirUsuario = (email: string, senhaHash: string) =>
    db.execute({
        sql: "INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)",
        args: [email, senhaHash],
    });

const listarTarefasDoUsuario = (usuarioId: number, search?: string) => {
    if (search) {
        return db.execute({
            sql: `SELECT * FROM tarefas 
                  WHERE usuario_id = ? AND (titulo LIKE ? OR descricao LIKE ?) 
                  ORDER BY id DESC`,
            args: [usuarioId, `%${search}%`, `%${search}%`],
        });
    }
    return db.execute({
        sql: "SELECT * FROM tarefas WHERE usuario_id = ? ORDER BY id DESC",
        args: [usuarioId],
    });
};

const buscarTarefaPorIdEUsuario = (id: number, usuarioId: number) =>
    db.execute({
        sql: "SELECT * FROM tarefas WHERE id = ? AND usuario_id = ?",
        args: [id, usuarioId],
    });

const deletarTarefaPorIdEUsuario = (id: number, usuarioId: number) =>
    db.execute({
        sql: "DELETE FROM tarefas WHERE id = ? AND usuario_id = ?",
        args: [id, usuarioId],
    });

// Middleware de Autenticação (mantido da Aula 08 — jwt.verify é síncrono)
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token ausente ou mal formatado." });
    }

    const token = header.split(" ")[1]; // Pega só o token após a palavra 'Bearer'

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { id: number };
        req.usuarioId = payload.id; // Injeta o id no req para a rota usar
        next(); // Tudo certo! Segue para a rota.
    } catch {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

// ============================================================================
// TODO_09 — Passo 7: Rotas com tratamento refinado de erros (assíncronas)
// ============================================================================

// Rota de integridade do sistema (Health Check) — confere o banco de verdade
app.get("/api/health", async (_req: Request, res: Response) => {
    try {
        await db.execute("SELECT 1");
        return res.json({
            status: "ok",
            message: "Servidor do Gestor de Tarefas ativo!",
            banco: MODO_BANCO,
        });
    } catch {
        return res.status(503).json({
            status: "erro",
            message: "O servidor está no ar, mas o banco de dados não respondeu.",
            banco: MODO_BANCO,
        });
    }
});

app.get("/api/version", (_req: Request, res: Response) => {
    res.json({ appName: "Gerenciador de Tarefas Multi-Usuário", version: "1.0.0" });
});

app.get("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    const usuarioId = req.usuarioId!; // Garantimos que existe pois o middleware já checou
    // Coerção Segura: Forçamos a variável a ser uma String vazia caso tentem nos enviar um Array
    const search = typeof req.query.search === "string" ? req.query.search : "";

    try {
        const { rows } = await listarTarefasDoUsuario(usuarioId, search || undefined);
        return res.json(rows);
    } catch (erro) {
        // Erro Controlado: Se algo quebrar, damos uma mensagem genérica para não vazar a estrutura do banco
        return res.status(500).json({ error: "Erro interno ao processar a listagem." });
    }
});

app.post("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    const usuarioId = req.usuarioId!;
    const { titulo, prioridade } = req.body;
    const prioridadeValida = normalizarPrioridade(prioridade);

    // Validação via helper (type guard)
    if (!tituloValido(titulo)) {
        return res.status(400).json({
            error: "O título da tarefa é obrigatório e deve conter pelo menos 3 caracteres válidos."
        });
    }

    try {
        const resultado = await db.execute({
            sql: "INSERT INTO tarefas (titulo, status, prioridade, usuario_id) VALUES (?, 'pending', ?, ?)",
            args: [titulo.trim(), prioridadeValida, usuarioId],
        });
        const idInserido = Number(resultado.lastInsertRowid);
        const { rows } = await buscarTarefaPorIdEUsuario(idInserido, usuarioId);
        const novaTarefa = rows[0] as unknown as Tarefa;

        return res.status(201).json(novaTarefa);
    } catch {
        return res.status(500).json({ error: "Erro ao processar persistência" });
    }
});

app.delete("/api/tasks/:id", authenticate, async (req: AuthRequest, res) => {
    const usuarioId = req.usuarioId!;
    // Validação de ID padronizada (igual PUT/PATCH)
    const idParaDeletar = parsearId(String(req.params.id));

    if (idParaDeletar === null) {
        return res.status(400).json({ error: "ID inválido." });
    }

    try {
        const resultado = await deletarTarefaPorIdEUsuario(idParaDeletar, usuarioId);

        if (resultado.rowsAffected === 0) {
            return res.status(404).json({ error: "Tarefa não localizada para exclusão." });
        }

        return res.json({ message: "Tarefa excluída do banco SQLite com sucesso!" });
    } catch {
        return res.status(500).json({ error: "Erro interno ao processar a exclusão." });
    }
});

app.put("/api/tasks/:id", authenticate, async (req: AuthRequest, res) => {
    const usuarioId = req.usuarioId!;
    const idParaAtualizar = parsearId(String(req.params.id));

    if (idParaAtualizar === null) {
        return res.status(400).json({ error: "ID inválido." });
    }

    const { titulo, prioridade, status } = req.body;

    // Validação via helpers
    if (!tituloValido(titulo)) {
        return res.status(400).json({
            error: "O título da tarefa é obrigatório e deve conter pelo menos 3 caracteres válidos."
        });
    }

    const prioridadeValida = normalizarPrioridade(prioridade);
    const statusValido = normalizarStatus(status);

    try {
        const sql = "UPDATE tarefas SET titulo = ?, status = ?, prioridade = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?";
        const resultado = await db.execute({
            sql,
            args: [titulo.trim(), statusValido, prioridadeValida, idParaAtualizar, usuarioId],
        });

        if (resultado.rowsAffected === 0) {
            return res.status(404).json({ message: "Tarefa não encontrada para atualização!" });
        }

        const { rows } = await buscarTarefaPorIdEUsuario(idParaAtualizar, usuarioId);
        const tarefaAtualizada = rows[0] as unknown as Tarefa;
        return res.status(200).json(tarefaAtualizada);
    } catch {
        return res.status(500).json({ error: "Erro ao processar a atualização no banco de dados." });
    }
});

app.patch("/api/tasks/:id", authenticate, async (req: AuthRequest, res) => {
    const usuarioId = req.usuarioId!;
    const idParaAtualizar = parsearId(String(req.params.id));

    if (idParaAtualizar === null) {
        return res.status(400).json({ error: "ID inválido." });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Nenhum campo fornecido para atualização." });
    }

    const { titulo, prioridade, status } = req.body;

    try {
        const { rows: rowsExistente } = await buscarTarefaPorIdEUsuario(idParaAtualizar, usuarioId);
        const tarefaExistente = rowsExistente[0] as unknown as Tarefa | undefined;
        if (!tarefaExistente) {
            return res.status(404).json({ message: "Tarefa não encontrada para atualização!" });
        }

        const camposParaAtualizar: string[] = [];
        const valoresParaAtualizar: unknown[] = [];

        // Título (se enviado)
        if (titulo !== undefined) {
            if (!tituloValido(titulo)) {
                throw new Error("O título da tarefa deve conter pelo menos 3 caracteres válidos.");
            }
            camposParaAtualizar.push("titulo = ?");
            valoresParaAtualizar.push(titulo.trim());
        }

        // Prioridade (se enviada)
        if (prioridade !== undefined) {
            if (!PRIORIDADES.includes(prioridade as typeof PRIORIDADES[number])) {
                throw new Error("Prioridade inválida. Use 'low', 'medium' ou 'high'.");
            }
            camposParaAtualizar.push("prioridade = ?");
            valoresParaAtualizar.push(prioridade);
        }

        // Status (se enviado)
        if (status !== undefined) {
            if (!STATUS_VALIDOS.includes(status as typeof STATUS_VALIDOS[number])) {
                throw new Error("Status inválido. Use 'pending' ou 'completed'.");
            }
            camposParaAtualizar.push("status = ?");
            valoresParaAtualizar.push(status);
        }

        if (camposParaAtualizar.length === 0) {
            return res.status(200).json(tarefaExistente);
        }

        // Query dinâmica SEGURA: placeholders ? + valores array
        const sql = `UPDATE tarefas SET ${camposParaAtualizar.join(", ")} WHERE id = ? AND usuario_id = ?`;
        valoresParaAtualizar.push(idParaAtualizar, usuarioId);

        await db.execute({ sql, args: valoresParaAtualizar as any[] });

        const { rows } = await buscarTarefaPorIdEUsuario(idParaAtualizar, usuarioId);
        return res.status(200).json(rows[0] as unknown as Tarefa);
    } catch (erro) {
        // Log detalhado no terminal para depuração
        console.error("[PATCH /api/tasks/:id] Erro:", erro);

        // Distingue erro de validação (400) de erro interno (500)
        if (erro instanceof Error && (erro.message.includes("inválid") || erro.message.includes("caracteres"))) {
            return res.status(400).json({ error: erro.message });
        }
        return res.status(500).json({ error: "Erro ao processar a atualização parcial no banco." });
    }
});

app.post("/api/auth/register", async (req, res) => {
    const { email, senha } = req.body ?? {};

    // Validação inicial dos dados
    if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "E-mail inválido." });
    }
    if (!senha || typeof senha !== "string" || senha.length < 6) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    // Criando a "impressão digital" da senha
    const hash = await bcrypt.hash(senha, 10);

    try {
        const resultado = await inserirUsuario(email.trim(), hash);
        const idInserido = Number(resultado.lastInsertRowid);

        return res.status(201).json({
            message: "Usuário cadastrado com sucesso!",
            user: { id: idInserido, email: email.trim() },
        });
    } catch (erro: any) {
        // Só é 409 se for violação de chave única
        if (String(erro?.code) === "SQLITE_CONSTRAINT") {
            return res.status(409).json({ error: "E-mail já cadastrado." });
        }
        return res.status(500).json({ error: "Não foi possível cadastrar agora. Tente de novo." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, senha } = req.body ?? {};

    if (!email || !senha) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    let usuario: Usuario | undefined;
    try {
        const { rows } = await buscarUsuarioPorEmail(email.trim());
        usuario = primeiraLinha<Usuario>(rows);
    } catch {
        return res.status(500).json({ error: "Não foi possível entrar agora. Tente de novo." });
    }

    if (!usuario) {
        return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
        return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Gerando o "Crachá" de acesso (8h conforme TODO_09)
    const token = jwt.sign(
        { id: usuario.id, email: usuario.email },
        JWT_SECRET,
        { expiresIn: "8h" }
    );

    return res.json({ token });
});

// (a) Uma rota de API que não existe tem que responder JSON, e não HTML.
// Se esta linha ficasse depois do SPA fallback, "GET /api/typo" cairia nele e
// devolveria o index.html com status 200: um erro da API viraria uma página de
// "sucesso", e o front receberia HTML onde esperava JSON.
app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Rota de API não encontrada." });
});

// (b) Os arquivos que o `npm run build` do Vite produziu em web/dist.
// index.html, os .js com hash no nome, o .css e as imagens da public/.
app.use(express.static(FRONT_DIST));

// (c) Qualquer outro caminho não é API: é uma rota do React, que roda no
// navegador. Devolvemos o index.html para o app assumir. É o que permite
// abrir ou recarregar /tarefas sem o servidor responder "não encontrado".
//
// Sobre o /(.*)/: no Express 5 o curinga "*" deixou de existir e precisa ser
// escrito como regex (a outra forma seria o padrão nomeado "/*splat"). O ponto
// é que este curinga é bem mais largo que o do Express 4 — por isso a linha
// (a) acima precisa vir antes: é ela que impede "/api/qualquer-coisa" de cair
// aqui e virar uma página em vez de um erro.
app.get(/(.*)/, (_req: Request, res: Response) => {
    if (!fs.existsSync(FRONT_INDEX)) {
        return res.status(503).type("text/plain").send(SEM_BUILD);
    }

    return res.sendFile(FRONT_INDEX);
});

function verificarFront(): void {
    if (!fs.existsSync(FRONT_INDEX)) {
        console.warn("\n[ATENÇÃO] " + SEM_BUILD + "\n");
        return;
    }

    const fontes = path.join(__dirname, "web", "src");
    const temFontes = fs.existsSync(fontes);

    if (temFontes && maisRecente(fontes) > fs.statSync(FRONT_INDEX).mtimeMs) {
        console.warn(
            "\n[ATENÇÃO] O build do front está VELHO: algum arquivo de web/src " +
            "mudou depois do último `npm run build`.\n" +
            "          Rode `cd web && npm run build` para ver a mudança.\n",
        );
    }
}

// ============================================================================
// TODO_09 — Passo 8: Inicialização do servidor com await inicializarBanco()
// ============================================================================
async function iniciarServidor(): Promise<void> {
    await inicializarBanco();

    app.listen(PORT, () => {
        exibirBannerBanco();
        console.log(`Servidor rodando em: http://localhost:${PORT}`);
        console.log(`API:   http://localhost:${PORT}/api/health`);
        console.log(`Front: http://localhost:${PORT}`);
        verificarFront();
    });
}

iniciarServidor();