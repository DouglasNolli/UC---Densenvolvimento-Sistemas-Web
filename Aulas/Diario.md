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

