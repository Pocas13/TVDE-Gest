# Changelog

## 1.4.0
- Integração Bolt alinhada com `getFleetOrders` e filtro `PRICE_REVIEW`.
- Importação histórica retomável em blocos de 7 dias.
- Progresso persistido na D1; proteção contra duplicados por `order_reference`.
- Motoristas e viaturas Bolt filtrados por estado ativo.
- Token OAuth2 Bolt reutilizado e renovado antes de expirar.
- Interface para criar, processar e acompanhar o arquivo histórico.
- Preparação para dados agregados importados por CSV quando a API não disponibilizar detalhe histórico.

# Changelog

## 1.3.0
- Cálculo Bolt baseado em Ganhos líquidos.
- Gorjetas e portagens retiradas antes do IVA e acrescentadas novamente depois.
- Campanhas, reembolsos, cancelamentos e taxas de reserva separados.
- Visão geral redesenhada para ocupar toda a largura.
