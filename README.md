# UC — Desenvolvimento de Sistemas Web

**Estudante:** Douglas R. Nolli

Atividades da disciplina de Desenvolvimento de Sistemas Web. O projeto principal é um **gerenciador de tarefas (To-Do List)** com múltiplos usuários, autenticação JWT e persistência em SQLite.

## 🛠️ Tecnologias

- **Back-end:** Node.js, Express, TypeScript, better-sqlite3
- **Segurança:** bcrypt (hash de senha) e JWT (autenticação)
- **Front-end:** React, TypeScript, Vite e Tailwind CSS

## 📁 Estrutura

| Pasta / arquivo | Conteúdo |
| --- | --- |
| `01-projeto-gerenciador-tarefas/` | Primeiras aulas: servidor, exercícios de Tailwind |
| `02-servidor-express/` | Servidor Express desenvolvido em aula |
| `03-primeiro-app-react/` | Primeiro app React (aula de 07/10) |
| `server.ts` | API atual com rotas protegidas por JWT |
| `request.http` | Testes das rotas da API |
| `web/` | Front-end React com login e consumo da API |
| `Diario.md` | Diário de bordo com o que foi aprendido em cada aula |

## ▶️ Como rodar

**1. API** (na raiz, porta 3000)

```bash
npm install
npm run dev
```

**2. Front-end** (em outro terminal)

```bash
cd web
npm install
npm run dev
```

Acesse o endereço exibido pelo Vite (geralmente `http://localhost:5173`). As chamadas para `/api` são redirecionadas para a API automaticamente.

## 🔌 Rotas da API

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cria um usuário |
| `POST` | `/api/auth/login` | Faz login e retorna o token JWT |
| `GET` | `/api/tasks` | Lista as tarefas do usuário 🔒 |
| `POST` | `/api/tasks` | Cria uma tarefa 🔒 |
| `PUT` / `PATCH` | `/api/tasks/:id` | Atualiza uma tarefa 🔒 |
| `DELETE` | `/api/tasks/:id` | Remove uma tarefa 🔒 |

🔒 Exige o header `Authorization: Bearer <token>`.
