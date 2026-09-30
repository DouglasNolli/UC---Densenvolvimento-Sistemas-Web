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
(centralizar validações e tipagem no topo do arquivo, usar Prepared Statements para evitar SQL Injection e retornar erros genéricos em vez de expor detalhes do banco)

## 🧩 Principal dificuldade
(entender por que enviar arrays na busca (?search=a&search=b) não quebrava o servidor, mas fazia ele se comportar de forma inesperada)

## 🔧 Como eu resolvi
(testei antes e depois de validar com typeof req.query.search === "string" e vi a diferença no comportamento)

##💡Observações (opcional)
(falta blindar as rotas de escrita — POST, DELETE, PUT, PATCH — na próxima aula)

------------------------------------------------------------------------

# Aula 02 — Blindando as rotas de escrita: POST, DELETE, PUT e PATCH (16/09/2026)

## ✅ O que eu aprendi
(padronizar POST, DELETE, PUT e PATCH com os helpers e o parsearId(), usar db.transaction() para garantir atomicidade no PATCH e montar query dinâmica segura com placeholders, e separar erro 400 (validação) de 500 (interno) sem vazar detalhes do banco)

## 🧩 Principal dificuldade
(entender como montar a query dinâmica do PATCH sem concatenar valor do usuário direto no SQL, já que cada campo é opcional)

## 🔧 Como eu resolvi
(montei os arrays camposParaAtualizar e valoresParaAtualizar separadamente, mantendo os nomes de coluna fixos no código e os valores sempre passados como parâmetro ?)

##💡Observações (opcional)
(fixei as 4 regras de ouro: nunca validar inline, nunca criar db.prepare() dentro da rota, nunca devolver erro.message pro cliente e nunca concatenar valor do usuário no SQL)

------------------------------------------------------------------------

# Aula 03 — Autenticação: registro e login com bcrypt e JWT (23/09/2026)

## ✅ O que eu aprendi
(nunca guardar senha em texto puro, usar bcrypt.hashSync para gerar o hash no registro e bcrypt.compareSync para conferir no login, e gerar um token JWT com jwt.sign para o usuário provar quem é sem reenviar a senha)

## 🧩 Principal dificuldade
(entender por que o login compara a senha com um hash falso mesmo quando o e-mail não existe, em vez de simplesmente retornar erro na hora)

## 🔧 Como eu resolvi
(vi que isso evita timing attack: sem o hash falso, a resposta do servidor seria mais rápida quando o e-mail não existe, e um atacante poderia usar esse tempo para descobrir quais e-mails estão cadastrados)

##💡Observações (opcional)
(o e-mail agora é UNIQUE no banco, então tive que apagar o tarefas.db antigo para a regra valer; próxima aula é usar o token JWT para proteger as rotas de tarefas)

