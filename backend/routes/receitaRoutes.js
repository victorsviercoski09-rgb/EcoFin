
const express = require("express");

function criarReceitaRouter(db) {
    const router = express.Router();

    // Consultar ganhos e gastos
    router.get("/", async (req, res) => {
        try {
            const idUsuario = req.usuarioId;

            const [movimentacoes] = await db.execute(
                `SELECT
                    'receita' AS tipo,
                    id_ganho AS id,
                    descricao,
                    categoria,
                    valor,
                    DATE_FORMAT(
                        data_movimentacao,
                        '%Y-%m-%d'
                    ) AS data
                 FROM ganhos
                 WHERE id_usuario = ?

                 UNION ALL

                 SELECT
                    'gasto' AS tipo,
                    id_gasto AS id,
                    descricao,
                    categoria,
                    valor,
                    DATE_FORMAT(
                        data_movimentacao,
                        '%Y-%m-%d'
                    ) AS data
                 FROM gastos
                 WHERE id_usuario = ?

                 ORDER BY data DESC, id DESC`,
                [idUsuario, idUsuario]
            );

            const [totais] = await db.execute(
                `SELECT
                    (
                        SELECT COALESCE(SUM(valor), 0)
                        FROM ganhos
                        WHERE id_usuario = ?
                          AND data_movimentacao >=
                              DATE_FORMAT(CURDATE(), '%Y-%m-01')
                          AND data_movimentacao <
                              DATE_FORMAT(
                                  CURDATE() + INTERVAL 1 MONTH,
                                  '%Y-%m-01'
                              )
                    ) AS ganhosMes,

                    (
                        SELECT COALESCE(SUM(valor), 0)
                        FROM gastos
                        WHERE id_usuario = ?
                          AND data_movimentacao >=
                              DATE_FORMAT(CURDATE(), '%Y-%m-01')
                          AND data_movimentacao <
                              DATE_FORMAT(
                                  CURDATE() + INTERVAL 1 MONTH,
                                  '%Y-%m-01'
                              )
                    ) AS gastosMes`,
                [idUsuario, idUsuario]
            );

            const ganhosMes = Number(totais[0].ganhosMes);
            const gastosMes = Number(totais[0].gastosMes);

            res.json({
                ganhosMes,
                gastosMes,
                saldoMes: ganhosMes - gastosMes,
                movimentacoes
            });

        } catch (erro) {
            console.error("Erro ao consultar receita:", erro);

            res.status(500).json({
                mensagem: "Erro ao consultar dados financeiros."
            });
        }
    });

    // Cadastrar ganho ou gasto
    router.post("/", async (req, res) => {
        try {
            const {
                tipo,
                valor,
                descricao,
                categoria,
                data
            } = req.body || {};

            const numero = Number(valor);

            const dataValida =
                typeof data === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(data) &&
                !Number.isNaN(Date.parse(`${data}T12:00:00Z`)) &&
                new Date(`${data}T12:00:00Z`)
                    .toISOString()
                    .slice(0, 10) === data;

            if (
                !["receita", "gasto"].includes(tipo) ||
                typeof descricao !== "string" ||
                !descricao.trim() ||
                descricao.trim().length > 150 ||
                typeof categoria !== "string" ||
                !categoria.trim() ||
                categoria.trim().length > 60 ||
                !Number.isFinite(numero) ||
                numero <= 0 ||
                numero > 9999999999.99 ||
                !dataValida
            ) {
                return res.status(400).json({
                    mensagem: "Preencha os campos corretamente."
                });
            }

            const tabela =
                tipo === "receita" ? "ganhos" : "gastos";

            const [resultado] = await db.execute(
                `INSERT INTO ${tabela}
                    (
                        id_usuario,
                        descricao,
                        categoria,
                        valor,
                        data_movimentacao
                    )
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    req.usuarioId,
                    descricao.trim(),
                    categoria.trim(),
                    numero,
                    data
                ]
            );

            res.status(201).json({
                mensagem:
                    tipo === "receita"
                        ? "Ganho cadastrado com sucesso!"
                        : "Gasto cadastrado com sucesso!",
                id: resultado.insertId
            });

        } catch (erro) {
            console.error("Erro ao cadastrar receita:", erro);

            res.status(500).json({
                mensagem: "Erro ao salvar movimentação."
            });
        }
    });

    return router;
}

module.exports = criarReceitaRouter;
