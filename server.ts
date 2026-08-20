import express from "express";
import DataBase from "better-sqlite3";

const app = express();
const PORT = 3000;

// Middware para ler os corpo das requisições em formato JSON
app.use(express.json());

const db = new DataBase("tarefas.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        prioridade TEXT DEFAULT 'medium'
    );
    
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        senha TEXT NOT NULL
    );
`);

//iNSERINDO DADOS FALSOS PARA SEREM VAZADOS
const usuariosExistentes = db.prepare("SELECT COUNT(*) AS count FROM USUARIOS").get() as any;
if (usuariosExistentes.count == 0) {
    db.exec(`
        INSERT INTO usuarios (email, senha) VALUES ('admin@senai.com', 'senha_super_segura_123')
    `);
}

console.log("banco de dados SQLite inicializando com sucesso!")
// Banco de Dados provisório em RAM
let bancoDeDadosProvisorio = [
    { id: 1, title: "Estudar arquitetura REST", status: "pendente" }
];

// Rota da tarefas (Tasks)
//app.get("/api/tasks", (req, res) => {
//    res.json(bancoDeDadosProvisorio);
//});

app.post("/api/tasks", (req, res) => {
    const { title, prioridade } = req.body;
    const prioridadeValida = ['low', 'medium', 'high'].includes(prioridade) ? prioridade : 'medium';
    
    // Validação rígida: Título obrigatório, não vazio e com tamanho mínimo
    // Sanitizamos com .trim() ANTES de checar o length, aplicando a regra de negócio
    if (!title || title.trim().length < 3) {
        return res.status(400).json({ 
            error: "O título da tarefa é obrigatório e deve conter pelo menos 3 caracteres válidos." 
        });
    }

    try {
        const sql = "INSERT INTO tarefas (titulo, status, prioridade) VALUES (?, 'pending', ?)";
        const resultado = db.prepare(sql).run(title.trim(), prioridadeValida);
        
        // Retorna o objeto recém-criado usando o ID gerado (lastInsertRowid).
        const novaTarefa = db.prepare("SELECT * FROM tarefas WHERE id = ?").get(resultado.lastInsertRowid);
        return res.status(201).json(novaTarefa);
    } catch (erro) {
        return res.status(500).json({ error: "Erro ao processar persistência" });
    }
});

// Criar nova tarefa (New Task)
app.post("/api/tasks", (req, res) => {
    const { title } = req.body;
    const novaTarefa = {
        id: Date.now(),
        title,
        status: "pendente"
    };
    bancoDeDadosProvisorio.push(novaTarefa);
    res.status(201).json(novaTarefa);
});

// Deletar tarefa (Delete Taks)
app.delete("/api/tasks/:id", (req, res) => {
    const idParaDeletar = parseInt(req.params.id);
    const tarefaExiste = bancoDeDadosProvisorio.some(t => t.id === idParaDeletar);

    if (!tarefaExiste) {
        return res.status(404).json({ message: "Tarefa não existe!" });
    }

    bancoDeDadosProvisorio = bancoDeDadosProvisorio.filter(t => t.id !== idParaDeletar);
    res.json({ message: "Tarefa removida com sucesso!" });
});

// Rota principal de FALLBACK
app.get("/", (req, res) => {
    res.json({ turma: "ADS-2025" });
});

// Rota de integridade do sistema (Health Check)
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor do Gestor de Tarefas ativo!" });
});

// Rota da versão do sistema (Version Check)
app.get("/api/version", (req, res) => {
    res.json({ appName: "Gerenciador de Tarefas Multi-Usuários", version: "1.0.0" });
});

app.listen(PORT, () => {
    console.log(`Servido rodando em: http://localhost:${PORT}`);
});