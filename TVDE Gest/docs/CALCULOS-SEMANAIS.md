# Cálculos semanais — TVDE Gest v0.7.2

## Fórmula oficial usada pela aplicação

1. Somar as viagens Uber e Bolt.
2. Retirar o IVA incluído: `total de viagens / 1,06`.
3. Somar as gorjetas Uber e Bolt.
4. Somar as portagens Uber e Bolt.
5. Aplicar a regra do motorista sobre esta base semanal:
   - aluguer fixo de 225 € ou 250 €;
   - slot fixo de 25 €;
   - comissão percentual, como 4% no caso do Marcelo.
6. Obter o valor a pagar ao motorista.
7. Subtrair pagamentos já efetuados.
8. Apresentar o saldo pendente.

## Exemplo

- Viagens: 1.000 €
- Viagens sem IVA: 1.000 / 1,06 = 943,40 €
- Gorjetas: 10 €
- Portagens: 10 €
- Base semanal: 963,40 €

Com aluguer de 250 €: `963,40 - 250 = 713,40 €`.

Com comissão de 4%: `963,40 × 4% = 38,54 €`; motorista recebe `924,86 €`.

A comissão percentual incide sobre a base semanal completa: viagens sem IVA + gorjetas + portagens.
