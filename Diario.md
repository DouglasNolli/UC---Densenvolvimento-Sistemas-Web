# Aula 00 — Ambiente e primeiros passos (02/09/2026)

## ✅ O que eu aprendi
(ex.: instalei o Node e rodei o servidor pela primeira vez)

## 🧩 Principal dificuldade
(ex.: o npm install deu erro por não encontrar o package.json, quando dava o npm install ele tentava achar o .json em uma pasta diferente)

## 🔧 Como eu resolvi
(ex.: apaguei as pastas e subpastas e começei com uma pasta do zero)

##💡Observações (opcional)
(ate o momento nenhuma)

------------------------------------------------------------------------

# Aula 01 — Segurança do servidor: tipagem, validação e prepared statements (02/09/2026)

## ✅ O que eu aprendi
Centralizar validações e tipagem no topo do arquivo, usar Prepared Statements para evitar SQL Injection e retornar erros genéricos em vez de expor detalhes do banco

## 🧩 Principal dificuldade
Entender por que enviar arrays na busca (?search=a&search=b) não quebrava o servidor, mas fazia ele se comportar de forma inesperada

## 🔧 Como eu resolvi
Testei antes e depois de validar com typeof req.query.search === "string" e vi a diferença no comportamento

##💡Observações (opcional)
Falta blindar as rotas de escrita — POST, DELETE, PUT, PATCH — na próxima aula

------------------------------------------------------------------------

# Aula 02 — Blindando as rotas de escrita: POST, DELETE, PUT e PATCH (16/09/2026)

## ✅ O que eu aprendi
Padronizar POST, DELETE, PUT e PATCH com os helpers e o parsearId(), usar db.transaction() para garantir atomicidade no PATCH e montar query dinâmica segura com placeholders, e separar erro 400 (validação) de 500 (interno) sem vazar detalhes do banco

## 🧩 Principal dificuldade
Entender como montar a query dinâmica do PATCH sem concatenar valor do usuário direto no SQL, já que cada campo é opcional

## 🔧 Como eu resolvi
Montei os arrays camposParaAtualizar e valoresParaAtualizar separadamente, mantendo os nomes de coluna fixos no código e os valores sempre passados como parâmetro ?

##💡Observações (opcional)
Fixei as 4 regras de ouro: nunca validar inline, nunca criar db.prepare() dentro da rota, nunca devolver erro.message pro cliente e nunca concatenar valor do usuário no SQL

------------------------------------------------------------------------

# Aula 03 — Autenticação: registro e login com bcrypt e JWT (23/09/2026)

## ✅ O que eu aprendi
Entender como implementar o registro e o login de usuários com segurança, utilizar bcrypt para criptografar senhas com hash e JWT para gerar tokens de autenticação que permitem identificar usuários autenticados

## 🧩 Principal dificuldade
Entender como o bcrypt e o JWT trabalham juntos no processo de autenticação, principalmente a diferença entre verificar a senha informada no login e gerar um token para validar a identidade do usuário nas próximas requisições

## 🔧 Como eu resolvi
Estudei o fluxo de registro e login, compreendendo como o bcrypt permite comparar a senha informada com o hash armazenado no banco de dados sem precisar guardar a senha original, e como o JWT é utilizado para gerar tokens que podem ser verificados posteriormente para proteger rotas

## 💡 Observações (opcional)
É importante nunca armazenar senhas em texto puro, utilizar uma chave secreta segura para assinar os tokens JWT e definir um tempo de expiração para eles; nas próximas aulas, o foco pode ser aplicar a autenticação para proteger rotas que exigem um usuário autenticado

------------------------------------------------------------------------

# Aula 04 — Protegendo rotas com JWT e isolando tarefas por usuário (30/09/2026)

## ✅ O que eu aprendi
Proteger rotas com middleware de autenticação JWT e filtrar as tarefas pelo identificador do usuário autenticado, garantindo que cada pessoa acesse apenas seus próprios registros

## 🧩 Principal dificuldade
Entender por que validar o token não era suficiente para isolar as tarefas, sendo necessário também filtrar as consultas pelo identificador do usuário

## 🔧 Como eu resolvi
Utilizei o identificador do usuário autenticado nas consultas ao banco de dados, garantindo que as operações de listar, atualizar e excluir respeitassem a propriedade de cada tarefa

## 💡 Observações (opcional)
A autenticação e o isolamento das tarefas impedem o acesso indevido aos registros de outros usuários; na próxima aula, o foco será continuar aprimorando o controle de acesso às rotas

------------------------------------------------------------------------

#Aula 05 — Introdução ao React (07/10/2026 e 14/10/2026)

## ✅ O que eu aprendi
Criar componentes reutilizáveis, organizar a interface em uma estrutura modular, utilizar props para passar dados e funções entre componentes e gerenciar estados para atualizar listas e formulários dinamicamente

## 🧩 Principal dificuldade
Entender por que a alteração do estado de um item não atualizava corretamente o componente responsável por exibi-lo

## 🔧 Como eu resolvi
Ajustei a passagem de dados e funções por props entre os componentes, garantindo que as alterações de estado fossem refletidas corretamente na interface

## 💡 Observações (opcional)
O projeto está na pasta Aula-07-10-2026/minha-primeira-confeitaria; continuar praticando a componentização e o gerenciamento de estado no React

------------------------------------------------------------------------

# Aula 06 — Conectando o React à API com login JWT (21/10/2026)

## ✅ O que eu aprendi
Arquivos novos na raiz: server.ts — API com CORS, rotas /api/tasks protegidas por JWT e /api/auth/register e /login; request.http — testes das rotas; tarefas.db — banco SQLite; web/ — app React + TypeScript com api.ts (chamadas à API e token no localStorage), Login.tsx (tela de login/registro) e App.tsx

## 🧩 Principal dificuldade
Fazer o front conversar com a API sem erro de CORS e manter o token entre as requisições

## 🔧 Como eu resolvi
Liberei o CORS no server.ts e centralizei o endereço da API e o token no api.ts

## 💡 Observações (opcional)
Próxima aula: ligar o CRUD de tarefas na tela — Aula 07
