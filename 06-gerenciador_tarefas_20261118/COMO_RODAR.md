# Como Rodar o Gerenciador de Tarefas

## Estrutura do Projeto

```
gerenciador_tarefas_20261118/
├── package.json          # Backend (Express + TypeScript)
├── server.ts             # Entry point do backend
├── .env                  # Variáveis de ambiente
└── web/                  # Frontend (React + Vite + TypeScript)
    ├── package.json
    └── ...
```

---

## 1. Pré-requisitos

- **Node.js** ≥ 18 (recomendado 20+)
- **npm** ≥ 9

---

## 2. Configurar Variáveis de Ambiente

O arquivo `.env` já existe na raiz. Verifique se contém:

```env
DATABASE_URL="file:./tarefas.db"
JWT_SECRET="sua_chave_secreta_forte"
PORT=3000
```

> Se não existir `tarefas.db`, o banco será criado automaticamente na primeira execução.

---

## 3. Instalar Dependências

### Backend (raiz do projeto)

```bash
cd C:\Dev\gerenciador_tarefas_20261118
npm install
```

### Frontend (pasta web)

```bash
cd web
npm install
cd ..
```

---

## 4. Rodar em Desenvolvimento

### Opção A: Terminal único (backend apenas)

```bash
# Na raiz do projeto
npm run dev
```

> Isso roda `tsx watch server.ts` (backend com hot-reload)  
> **Nota:** O frontend **não** sobe automaticamente com este comando.

### Opção B: Dois terminais (recomendado para dev)

**Terminal 1 – Backend:**
```bash
cd C:\Dev\gerenciador_tarefas_20261118
npm run dev
```
- Backend em `http://localhost:3000`
- API disponível em `http://localhost:3000/api/...`

**Terminal 2 – Frontend:**
```bash
cd C:\Dev\gerenciador_tarefas_20261118\web
npm run dev
```
- Frontend (Vite) em `http://localhost:5173`
- Proxy configurado no `vite.config.ts` deve apontar para `http://localhost:3000`

---

## 5. Build para Produção

```bash
# Na raiz do projeto
npm run build
```

Isso executa:
1. `npm --prefix web install` – garante deps do frontend
2. `npm run build:web` – build do Vite (`tsc && vite build`) → gera `web/dist/`
3. `tsc` – compila o backend TypeScript → gera `.js` na raiz

---

## 6. Rodar em Produção

```bash
# Na raiz do projeto
npm start
```

- Roda `tsx server.ts` (usa arquivos já compilados se existirem)
- Serve o frontend estático de `web/dist/` (configurado no `server.ts`)
- Acesso único em `http://localhost:3000`

---

## 7. Scripts Úteis (package.json raiz)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Backend com hot-reload (`tsx watch`) |
| `npm run start` | Produção (`tsx server.ts`) |
| `npm run build` | Build completo (frontend + backend) |
| `npm run build:web` | Apenas build do frontend |
| `npm run dev:web` | Apenas frontend em dev (`vite`) |

---

## 8. Checklist Rápido

- [ ] Node.js instalado
- [ ] `npm install` na raiz ✓
- [ ] `npm install` em `web/` ✓
- [ ] `.env` configurado ✓
- [ ] Dois terminais: `npm run dev` (raiz) + `npm run dev` (web/) ✓
- [ ] Acessar `http://localhost:5173` (frontend) → comunica com `http://localhost:3000` (API) ✓

---

## 9. Problemas Comuns

| Problema | Solução |
|----------|---------|
| `tsx: not found` | `npm install` na raiz |
| Porta 3000 ocupada | Mude `PORT` no `.env` ou mate o processo |
| Frontend não chama API | Confira `vite.config.ts` → `server.proxy` aponta para `http://localhost:3000` |
| Erro de CORS | Backend já tem `cors()` habilitado em `server.ts` |
| Banco não criado | Rode `npm run dev` uma vez; `tarefas.db` aparece na raiz |