# Changelog

## 0.5.0 — Uber, D1 e acertos semanais

- Base de dados Cloudflare D1 para dados persistentes e sincronização sem o navegador aberto.
- Integração Bolt movida para o servidor e mantida compatível com a API existente.
- Preparação da integração Uber Supplier Platform por OAuth2 Client Credentials.
- Sincronização automática por Cloudflare Cron Triggers.
- Cálculos semanais nos modos Apenas aluguer, Frota paga motorista e Percentagem.
- Regras de acerto desativadas por defeito para impedir cobranças acidentais.
- Deduplicação de motoristas, viaturas e movimentos financeiros.
- Migração opcional dos dados locais do navegador para D1.
