# TVDE Gest v1.0.1

- Permite calcular acertos apenas com a Bolt enquanto a Uber não autorizar o tratamento combinado.
- Não inclui qualquer dado Uber nesse modo.
- Corrige a persistência das regras por motorista: todas as regras passam a existir fisicamente na D1.
- Confirma a regra guardada através de nova leitura da base de dados.
- Mantém a fórmula: viagens ÷ 1,06 + gorjetas + portagens − aluguer/slot/4%.
