# Arquitetura

O TVDE Gest normaliza dados Bolt e Uber para as entidades internas `drivers`, `vehicles` e `financial_entries`. A origem fica sempre identificada pelo campo `platform`.

O espelho consolidado soma valores apenas para gestão interna e apresenta sempre o detalhe por plataforma. Os acertos usam a fórmula:

`(viagens Uber + Bolt) / 1,06 + gorjetas + portagens - aluguer/slot/4% - pagamentos = saldo`

Enquanto a Uber não disponibilizar os scopes, o cálculo funciona exclusivamente com dados Bolt.
