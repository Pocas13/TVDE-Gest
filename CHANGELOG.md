# TVDE Gest

## Atualização principal

- Frontend totalmente modular, sem JavaScript embutido no HTML.
- Novo cockpit operacional de largura total.
- Dashboard nunca fica em branco: erros e estados vazios são apresentados.
- Histórico Bolt agregado de 30/12/2025 a 19/07/2026 carregado na D1.
- Atividade Uber real de 15/06/2026 a 13/07/2026 carregada na D1.
- Importação de CSV Bolt e Uber diretamente no painel.
- Fórmula Bolt corrigida: ganhos líquidos menos gorjetas e portagens, divisão por 1,06, reposição de gorjetas e portagens.
- Intervalos: esta semana, anterior, quatro semanas, trimestre, ano e datas personalizadas.
- Arquivo Bolt por blocos semanais com retoma após rate limit.
- Diagnóstico de Worker, Assets, D1, credenciais e volume de dados.
- Área privada do motorista por ligação expirável e revogável.
- Fundação multiempresa: organizações, utilizadores, membros e tenant_id.
- Páginas de motoristas, viaturas, ganhos, cálculos, importações, integrações e produto SaaS.

## 2.0.2
- Adicionado diagnóstico protegido da API Bolt em Sistema → Diagnóstico.
- Consulta direta a `getFleetOrders`, sem CSV.
- Lista automática de todos os campos devolvidos, candidatos financeiros e três amostras com dados pessoais ocultados.
- Botão para copiar o resultado e permitir mapear corretamente gorjetas e portagens.
