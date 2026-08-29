# HTTP security baseline

O bootstrap da aplicação aplica um baseline de segurança independente do reverse proxy:

- remove `X-Powered-By`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy` bloqueando câmera, microfone e geolocalização por padrão;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` para preservar fluxos OAuth em popup;
- limite global de body em 10 MB.

O upload de conhecimento continua limitado pela própria procedure a 8 MB de Base64 / 5 MB de arquivo real. Endpoints que futuramente precisarem de arquivos maiores devem usar upload dedicado/streaming em vez de elevar o limite global.

CSP deve ser configurada depois de inventariar todos os domínios realmente necessários ao runtime, para não quebrar OAuth, storage ou integrações. Rate limiting deve ser distribuído quando houver múltiplas instâncias, evitando uma falsa sensação de proteção baseada apenas em memória local.
