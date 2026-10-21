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
(nunca deixar o recheio sem proteção térmica, usar termômetro de calda para atingir o ponto de bala mole na fervura e teste de consistência em água fria para conferir o ponto, e selar a torta com merengue suíço maçaricado para que ela mantenha a estrutura sem desabar na vitrine)

## 🧩 Principal dificuldade
(entender por que a receita pede para bater as claras em temperatura específica mesmo quando o açúcar ainda não dissolveu por completo, em vez de simplesmente misturar tudo de uma vez)

## 🔧 Como eu resolvi
(vi que isso evita o choque térmico e cristalização: sem o aquecimento controlado, o merengue perderia o brilho e a estabilidade, e a umidade do ambiente poderia talhar a cobertura inteira antes de ir ao forno)

## 💡 Observações (opcional)
(a forma de aro removível agora está com vedação perfeita, então tive que descartar o lote antigo de massas para a nova regra de crocância valer; próxima aula é usar a técnica do bico de confeiteiro para decorar os cupcakes temáticos)

------------------------------------------------------------------------

# Aula 04 — Protegendo rotas com JWT e isolando tarefas por usuário (30/09/2026)

## ✅ O que eu aprendi
(criar um posto de controle na entrada da bancada que lê o crachá do chef, valida a credencial com o selo de acesso e injeta o identificador do confeiteiro na comanda; todas as receitas da estação agora são filtradas pelo código do chef, então cada um só prepara e decora os próprios doces)

## 🧩 Principal dificuldade
(entender por que a comanda misturava os pedidos de diferentes chefs quando a estação ficava lotada, em vez de isolar os pratos de cada um na hora da expedição)

## 🔧 Como eu resolvi
(vi que isso acontecia por falta de uma identificação rígida no crachá: sem o selo de validação na entrada, qualquer confeiteiro conseguia mexer na bancada alheia, e a cozinha perdia o controle de quem era responsável por cada fornada)

## 💡 Observações (opcional)
(a caderneta de receitas ganhou a coluna de assinatura do chef, então foi preciso descartar o livro de anotações antigo e limpar todas as bancadas para reiniciar os testes do zero; a próxima aula será usar o selo de acesso para liberar o acesso exclusivo à câmara fria)

------------------------------------------------------------------------

# Aula 05 — Introdução ao React (07/10/2026 e 14/10/2026)

## ✅ O que eu aprendi
(estruturar uma nova estação de montagem com o kit de bancada modular, separar a cozinha em moldes e fornadas reutilizáveis, garantir que cada travessa principal tenha apenas uma base de sustentação, usar o controle dinâmico de estoque para gerenciar a caderneta de pedidos e o formulário de novos sabores, e passar as regras de preparo por delegação de atributos para confeitar ou descartar uma fornada)

## 🧩 Principal dificuldade
(entender por que alterar o status de um doce específico na bancada principal não atualizava instantaneamente a etiqueta individual na prateleira correspondente, em vez de recalcular a linha de produção inteira)

## 🔧 Como eu resolvi
(vi que isso ocorria porque a referência da comanda não retornava corretamente pela ordem de serviço: ao passar a função de controle para a sub-estação através da delegação adequada de parâmetros, a etiqueta passou a refletir o estado exato da fornada sem bagunçar a ordem dos pedidos)

## 💡 Observações (opcional)
(o caderno de receitas fica na pasta Aula-07-10-2026/minha-primeira-confeitaria — organizar os ingredientes na bancada e acender os fornos para iniciar a produção)
