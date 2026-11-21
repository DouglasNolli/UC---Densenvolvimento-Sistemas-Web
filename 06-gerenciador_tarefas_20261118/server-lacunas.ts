import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
// >>> LACUNA 1: SUBSTITUA a linha abaixo pelo import do @libsql/client <<<
// import Database from "better-sqlite3";  // <-- APAGUE ESTA LINHA
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.use(cors());
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_desenvolvimento";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONT_DIST = path.join(__dirname, "web", "dist");
const FRONT_INDEX = path.join(FRONT_DIST, "index.html");

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

// ============================================================================
// Interfaces (atualizadas para a Aula 09)
// ============================================================================
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
    usuarioId?: number;
}

const PRIORIDADES = ["low", "medium", "high"] as const;
const STATUS_VALIDOS = ["pending", "completed"] as const;

const tituloValido = (t: unknown): t is string =>
    typeof t === "string" && t.trim().length >= 3;

const normalizarPrioridade = (p: unknown) => {
    const listaPrioridades = PRIORIDADES as readonly string[];
    return typeof p === "string" && listaPrioridades.includes(p) ? p : "medium";
};

const normalizarStatus = (s: unknown) => {
    const listaStatus = STATUS_VALIDOS as readonly string[];
    return typeof s === "string" && listaStatus.includes(s) ? s : "pending";
};

const parsearId = (idParam: string): number | null => {
    const id = Number(idParam);
    return isNaN(id) ? null : id;
};

app.use(express.json());

// >>> LACUNA 2: função carregarEnv() com detecção de BOM + chamada <<<

// >>> LACUNA 3: constantes TURSO_URL, TURSO_TOKEN, usandoNuvem, MODO_BANCO <<<

// >>> LACUNA 4: criação do cliente db com createClient <<<

// >>> LACUNA 5: função exibirBannerBanco() <<<

// >>> LACUNA 6: constantes SQL_USUARIOS e SQL_TAREFAS <<<

// >>> LACUNA 7: async function inicializarBanco() <<<

// >>> LACUNA 8: helper primeiraLinha e helpers de consulta assíncronos <<<

// Middleware de Autenticação (mantido da Aula 08)
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token ausente ou mal formatado." });
    }
    const token = header.split(" ")[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { id: number };
        req.usuarioId = payload.id;
        next();
    } catch {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

// >>> LACUNA 9: rotas assíncronas (health, version, register, login) <<<

// Rotas de tarefas mantidas da Aula 08, adaptadas para assíncrono
app.get("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    const usuarioId = req.usuarioId!;
    const search = typeof req.query.search === "string" ? req.query.search : "";
    try {
        const { rows } = await listarTarefasDoUsuario(usuarioId, search || undefined);
        return res.json(rows);
    } catch {
        return res.status(500).json({ error: "Erro interno ao processar a listagem." });
    }
});

app.post("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    const usuarioId = req.usuarioId!;
    const { titulo, prioridade } = req.body;
    const prioridadeValida = normalizarPrioridade(prioridade);
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
    const idParaDeletar = parsearId(String(req.params.id));
    if (idParaDeletar === null) {
        return res.status(400).json({ error: "ID inválido." });
    }
    try {
        const resultado = await deletarTarefaPorIdEUsuario(idParaDeletar, usuarioId);
        if (resultado.rowsAffected === 0) {
            return res.status(404).json({ error: "Tarefa não localizada para exclusão." });
        }
        return res.json({ message: "Tarefa excluída com sucesso!" });
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

        if (titulo !== undefined) {
            if (!tituloValido(titulo)) {
                throw new Error("O título da tarefa deve conter pelo menos 3 caracteres válidos.");
            }
            camposParaAtualizar.push("titulo = ?");
            valoresParaAtualizar.push(titulo.trim());
        }
        if (prioridade !== undefined) {
            if (!PRIORIDADES.includes(prioridade as typeof PRIORIDADES[number])) {
                throw new Error("Prioridade inválida. Use 'low', 'medium' ou 'high'.");
            }
            camposParaAtualizar.push("prioridade = ?");
            valoresParaAtualizar.push(prioridade);
        }
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
        const sql = `UPDATE tarefas SET ${camposParaAtualizar.join(", ")} WHERE id = ? AND usuario_id = ?`;
        valoresParaAtualizar.push(idParaAtualizar, usuarioId);

        await db.execute({ sql, args: valoresParaAtualizar as any[] });

        const { rows } = await buscarTarefaPorIdEUsuario(idParaAtualizar, usuarioId);
        return res.status(200).json(rows[0] as unknown as Tarefa);
    } catch (erro) {
        if (erro instanceof Error && (erro.message.includes("inválid") || erro.message.includes("caracteres"))) {
            return res.status(400).json({ error: erro.message });
        }
        return res.status(500).json({ error: "Erro ao processar a atualização parcial no banco." });
    }
});

// >>> LACUNA 10: Static, API 404, SPA Fallback e verificarFront() <<<

// ============================================================================
// Inicialização do servidor
// ============================================================================
// >>> LACUNA 11: async function iniciarServidor() com await inicializarBanco() + app.listen <<<