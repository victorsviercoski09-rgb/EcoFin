const API_RECEITA = "/api/receita";

async function requisicaoReceita(opcoes = {}) {
    const token = localStorage.getItem("ecofin_token");

    if (!token) {
        throw new Error("Faça login novamente.");
    }

    const resposta = await fetch(API_RECEITA, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...opcoes.headers
        }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.mensagem || "Erro na requisição.");
    }

    return dados;
}