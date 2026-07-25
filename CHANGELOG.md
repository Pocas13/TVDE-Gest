# 0.6.1

- Corrige e repara automaticamente o `wrangler.jsonc`.
- Reutiliza a base D1 existente ou cria uma nova.
- Associa automaticamente o binding `DB` e aplica as migrações.

# Changelog

## 0.6.0 — Conformidade Uber e separação de plataformas

- Painel Uber e Bolt separado, sem comparação ou agregação por defeito.
- Bloqueio de acertos combinados enquanto não existir autorização escrita da Uber.
- Política de privacidade e termos de utilização interna.
- Registo de consentimentos, auditoria, pedidos de eliminação e eventos webhook.
- Verificação HMAC-SHA256 do cabeçalho `X-Uber-Signature`.
- Retenção configurável e limpeza automática de dados Uber.
- Endpoint administrativo para eliminação de dados de uma plataforma.
- Regras novas deixam a Uber desativada por defeito nos acertos.
