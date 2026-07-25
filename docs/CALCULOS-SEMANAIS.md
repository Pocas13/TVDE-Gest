# Acertos semanais no TVDE Gest

## Semana

A semana vai de segunda-feira a domingo. O acerto automático é recalculado na segunda-feira seguinte.

## Valores importados

O cálculo usa o campo líquido normalizado de cada plataforma:

- Bolt: `order_price.net_earnings`.
- Uber: categoria financeira `paid_to_you`, `payout`, `net_earnings` ou, quando indisponível, `your_earnings`.

A estrutura financeira Uber pode variar por país e tipo de movimento. Antes de usar os primeiros acertos reais, compara uma semana com o extrato oficial da Uber.

## Modelos

### RENT_ONLY — Apenas aluguer

Adequado quando o motorista recebe diretamente os rendimentos das plataformas e paga à empresa apenas o aluguer/encargos.

```text
base = - aluguer - taxa fixa + créditos - débitos
```

### FLEET_PAYOUT — Frota paga motorista

Adequado quando a empresa recebe os valores das plataformas e depois paga ao motorista.

```text
base = líquido das plataformas - aluguer - taxa fixa + créditos - débitos
```

### PERCENTAGE — Percentagem

```text
parcela_motorista = líquido das plataformas × percentagem
base = parcela_motorista - aluguer - taxa fixa + créditos - débitos
```

## Direção do saldo

- Saldo positivo: a empresa deve pagar ao motorista.
- Saldo negativo: o motorista deve pagar à empresa.
- Saldo zero: acerto concluído.

## Ajustes

- `credit`: valor a favor do motorista.
- `debit`: valor a favor da empresa.
- `payment`: pagamento já realizado pelo devedor, reduzindo o saldo em aberto.

## Regra inicial

Por segurança operacional, o sistema cria inicialmente:

```text
Modo: RENT_ONLY
Aluguer semanal: 250,00 €
Percentagem motorista: 100%
Taxa fixa: 0,00 €
Bolt: incluída
Uber: incluída
```

Esta regra fica **desativada por defeito**. Confirma os valores e ativa-a individualmente para cada motorista antes de calcular acertos reais.
