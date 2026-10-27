# Modo Financeiro EcoFin

1. Faça backup do banco `ecofin`.
2. No MySQL Workbench, execute **somente** `backend/financeiro.sql` no banco existente. NÃO execute novamente `schema.sql`, que usa CREATE TABLE sem IF NOT EXISTS.
3. No diretório `backend`, execute `npm install` e `npm start`.
4. Entre novamente pelo login para receber um token de sessão novo. Depois clique em Modo Financeiro na página ambiental.
5. Ganhos e gastos são persistidos no MySQL e separados por usuário. Renda mensal é informativa e não é somada automaticamente ao saldo, evitando duplicidade com ganhos registrados.
6. Simulador é local ao navegador, não salva dados e usa capitalização mensal a partir de taxa anual hipotética. Não estima impostos, taxas, inflação ou condições particulares de títulos.

**Limitações:** não foi possível testar a conexão com o MySQL do computador do usuário neste ambiente. A alteração de nome na página ambiental atual usa localStorage e não altera `nome_completo` no banco; as iniciais financeiras refletem o nome do cadastro. O sistema anterior de troca de senha ainda usa ID fornecido pelo navegador e merece atualização de segurança separada.
