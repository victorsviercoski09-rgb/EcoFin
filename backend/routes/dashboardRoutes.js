
app.get("/api/dashboard", async (req, res) => {
    try {
        // Temporário: substituir pelo ID da sessão autenticada.
        const usuarioId = req.session?.usuarioId;

        if (!usuarioId) {
            return res.status(401).json({
                erro: "Usuário não autenticado."
            });
        }

        const [movimentacoes] = await db.query(
            `SELECT id, descricao, valor, tipo, data
             FROM movimentacoes
             WHERE usuario_id = ?
             ORDER BY data DESC, id DESC
             LIMIT 10`,
            [usuarioId]
        );

        const [totais] = await db.query(
            `SELECT
                COALESCE(SUM(
                    CASE WHEN tipo = 'receita'
                    THEN valor ELSE 0 END
                ), 0) AS receitas,

                COALESCE(SUM(
                    CASE WHEN tipo = 'gasto'
                    THEN valor ELSE 0 END
                ), 0) AS gastos,

                COALESCE(SUM(
                    CASE WHEN tipo = 'receita'
                      AND data >= DATE_FORMAT(
                          CURDATE(), '%Y-%m-01'
                      )
                      AND data < DATE_FORMAT(
                          CURDATE() + INTERVAL 1 MONTH,
                          '%Y-%m-01'
                      )
                    THEN valor ELSE 0 END
                ), 0) AS rendaMensal
             FROM movimentacoes
             WHERE usuario_id = ?`,
            [usuarioId]
        );

        const receitas = Number(totais[0].receitas);
        const gastos = Number(totais[0].gastos);

        res.json({
            rendaMensal: Number(totais[0].rendaMensal),
            saldoDisponivel: receitas - gastos,
            movimentacoes
        });

    } catch (erro) {
        console.error("Erro no dashboard:", erro);

        res.status(500).json({
            erro: "Erro ao carregar dashboard."
        });
    }
});
