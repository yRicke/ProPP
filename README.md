# PRO — Prevenção & Performance

Landing do curso, construída sobre os templates Django existentes. A direção visual parte das três barras da PRO, do vermelho e das fotografias do esporte: tipografia condensada, composição editorial, regras finas e uma peça com perspectiva na abertura.

Para abrir localmente no PowerShell:

```powershell
.\venv\Scripts\python.exe manage.py runserver
```

A página está em `http://127.0.0.1:8000/` e `/landing/`.

## Organização

- `app/templates/base.html`: documento, metadados, fontes e estrutura comum.
- `app/templates/blocks/`: navegação, marca, setas, rodapé e diálogo do vídeo.
- `app/templates/sections/`: abertura, problema, método, público, mentores, depoimentos, inscrição, FAQ e encerramento.
- `app/landing_content.py`: textos, depoimentos, profissionais, valores e destinos de inscrição e acesso.
- `static/css/base.css`: tokens, tipografia, componentes e navegação. `landing.css`: composição das seções e responsividade.
- `static/js/navigation.js`: menu e indicação de seção. `landing-interactions.js`: depoimentos e vídeo. `landing-motion.js`: entradas e perspectiva com GSAP.
- `static/img/`: fotografias WebP e registro das fontes. `static/fonts/`: fontes WOFF2 locais com suas licenças.

## Movimento e carregamento

GSAP core 3.13.0 coordena a entrada do título, a revelação das palavras nas seções e uma inclinação de poucos graus na peça de abertura. O movimento não altera a rolagem nativa, não prende seções e não depende de loops contínuos. A perspectiva responde apenas a ponteiros precisos em telas maiores. `prefers-reduced-motion` desativa as animações e a inclinação.

As fotografias somam 459.282 bytes (aproximadamente 449 KiB), com no máximo 1080 px no maior lado. A imagem de abertura tem variante de 640 px, `srcset` e prioridade de carregamento. As demais são carregadas sob demanda e têm dimensões declaradas. Fontes e GSAP são locais; o player externo só é carregado após o clique e é removido ao fechar o diálogo.

Menu, FAQ, certificações e checkout mantêm alternativas sem JavaScript. Os depoimentos têm rolagem nativa, navegação por teclado e botões, sem reprodução automática.

## Conteúdo e integrações

Textos, credenciais, depoimentos, fotografias e condições comerciais foram extraídos da [landing fornecida](https://proprevencaoeperformance.digital/). Os retratos ilustrativos de depoimentos não foram reutilizados. A oferta foi preservada em R$ 197,00 à vista ou 12x de R$ 16,41, com 7 dias de garantia. A inscrição e a área do aluno apontam para os serviços existentes.

Na verificação de 19/10/2026, o embed do vídeo respondeu HTTP 200, mas o player da ConverteAI exibiu **“Vídeo temporariamente indisponível — verifique seu painel”**. A disponibilidade da mídia deve ser corrigida no provedor; o diálogo inclui um link alternativo para a página original.

Nenhum fluxo de autenticação, pagamento ou persistência foi implementado nesta etapa.

## Páginas de erro

Os erros **400, 403, 404 e 500** usam a identidade visual da PRO, com caminhos para voltar ao início, conhecer o método e falar com a equipe. As falhas de CSRF também usam a página 403, com uma orientação própria.

Os handlers estão em `app/error_views.py`, os templates em `app/templates/400.html`, `403.html`, `404.html`, `500.html` e `errors/base.html`, e os estilos em `static/css/errors.css`. A renderização dispensa processadores de contexto, consultas e os dados da landing; não exibe a mensagem interna da exceção.

Com `DEBUG=True`, é possível revisar cada página em:

- `http://127.0.0.1:8000/preview/erros/400/`
- `http://127.0.0.1:8000/preview/erros/403/`
- `http://127.0.0.1:8000/preview/erros/404/`
- `http://127.0.0.1:8000/preview/erros/500/`

As prévias ficam indisponíveis fora do modo de desenvolvimento. Os erros reais 400, 404 e 500 usam as páginas personalizadas com `DEBUG=False`; o modo de depuração do Django continua disponível durante o desenvolvimento. A configuração de `DEBUG` não foi alterada.

Para verificar o encaminhamento dos erros, CSRF, host inválido e independência dos processadores de contexto:

```powershell
.\venv\Scripts\python.exe manage.py test app
```

## Verificação

- `manage.py check`: sem problemas; `/` e `/landing/` retornam HTTP 200.
- Chromium: larguras de 320, 360, 390, 600, 768, 900, 1024, 1440 e 1920 px, sem rolagem horizontal.
- Menu e Escape, âncoras, certificações, FAQ exclusivo, depoimentos por botões e teclado, abertura e destruição do iframe, destinos de inscrição, movimento reduzido e fallback sem JavaScript verificados.
- Axe, regras WCAG 2 A/AA e 2.1 AA: nenhum apontamento automático no desktop e no mobile. A auditoria automática não substitui uma avaliação manual completa de acessibilidade.
- Sem erros de JavaScript; nenhuma requisição a terceiros antes do clique no vídeo.
