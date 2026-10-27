
"use strict";

const API_RECEITA = "/api/receita";

const estado = {
    tipo: "receita",
    categoria: "",
    filtro: "tudo",
    movimentacoes: []
};

const categorias = {
    receita: [
        "Trabalho",
        "Freelance",
        "Investimentos",
        "Vendas",
        "Presente",
        "Outros"
    ],
    gasto: [
        "Alimentação",
        "Moradia",
        "Transporte",
        "Saúde",
        "Lazer",
        "Educação",
        "Outros"
    ]
};

const $ = (id) => document.getElementById(id);

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    const partes = String(data || "").slice(0, 10).split("-");

    return partes.length === 3
        ? `${partes[2]}/${partes[1]}/${partes[0]}`
        : String(data || "");
}

function converterValor(texto) {
    let valor = String(texto).trim();

    valor = valor.replace(/[R$\s]/g, "");

    if (valor.includes(",")) {
        valor = valor.replace(/\./g, "").replace(",", ".");
    }

    return Number(valor);
}

async function chamarAPI(opcoes = {}) {
    const token = localStorage.getItem("ecofin_token");

    if (!token) {
        throw new Error(
            "Sessão não encontrada. Faça login novamente."
        );
    }

    const resposta = await fetch(API_RECEITA, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(opcoes.headers || {})
        }
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem || `Erro HTTP ${resposta.status}`
        );
    }

    return dados;
}

// MODAL

function abrirModal(tipo) {
    estado.tipo = tipo;
    estado.categoria = "";

    $("form-movimentacao").reset();

    const ganho = tipo === "receita";

    $("modal-titulo").textContent =
        ganho ? "Cadastrar ganho" : "Cadastrar gasto";

    $("modal-subtitulo").textContent =
        ganho
            ? "Registre um novo valor recebido."
            : "Registre um novo valor gasto.";

    $("modal-icone").textContent = ganho ? "↑" : "↓";
    $("modal-icone").className =
        `modal-icone ${ganho ? "ganho" : "gasto"}`;

    $("salvar-movimentacao").textContent =
        ganho ? "Salvar ganho" : "Salvar gasto";

    $("salvar-movimentacao").className =
        `btn-salvar ${ganho ? "ganho" : "gasto"}`;

    $("label-forma").textContent =
        ganho ? "Forma de recebimento" : "Forma de pagamento";

    $("recorrencia-titulo").textContent =
        ganho ? "Ganho recorrente" : "Gasto recorrente";

    $("descricao").placeholder =
        ganho
            ? "Ex.: Salário, freelance..."
            : "Ex.: Mercado, conta de luz...";

    $("categorias").className =
        `categorias ${ganho ? "ganho" : "gasto"}`;

    document.querySelector(".valor-container").className =
        `valor-container ${ganho ? "ganho" : "gasto"}`;

    const agora = new Date();
    const dataLocal = new Date(
        agora.getTime() - agora.getTimezoneOffset() * 60000
    );

    $("data").value = dataLocal.toISOString().slice(0, 10);

    montarCategorias(tipo);

    $("modal-overlay").hidden = false;
    document.body.style.overflow = "hidden";

    $("valor").focus();
}

function fecharModal() {
    $("modal-overlay").hidden = true;
    document.body.style.overflow = "";
}

function montarCategorias(tipo) {
    const container = $("categorias");
    container.replaceChildren();

    for (const categoria of categorias[tipo]) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = categoria;

        botao.addEventListener("click", () => {
            estado.categoria = categoria;

            container.querySelectorAll("button").forEach((item) => {
                item.classList.remove("ativo");
            });

            botao.classList.add("ativo");
        });

        container.appendChild(botao);
    }
}

// MOVIMENTAÇÕES

function mostrarVazio(mensagem, subtitulo = "") {
    const lista = $("lista-acoes");
    lista.replaceChildren();

    const vazio = document.createElement("div");
    vazio.className = "empty-state";

    const icone = document.createElement("div");
    icone.className = "empty-icon";
    icone.textContent = "▤";

    const titulo = document.createElement("h4");
    titulo.textContent = mensagem;

    const texto = document.createElement("p");
    texto.textContent = subtitulo;

    vazio.append(icone, titulo, texto);
    lista.appendChild(vazio);
}

function renderizarMovimentacoes() {
    const lista = $("lista-acoes");
    lista.replaceChildren();

    const movimentacoes = estado.movimentacoes.filter((item) => {
        return estado.filtro === "tudo" ||
            item.tipo === estado.filtro;
    });

    if (movimentacoes.length === 0) {
        mostrarVazio(
            "Nenhuma ação cadastrada",
            "Use os botões acima para cadastrar seu primeiro ganho ou gasto."
        );
        return;
    }

    for (const movimento of movimentacoes) {
        const linha = document.createElement("article");
        linha.className = "movimentacao";

        const info = document.createElement("div");
        info.className = "movimentacao-info";

        const descricao = document.createElement("strong");
        descricao.textContent = movimento.descricao;

        const detalhes = document.createElement("small");
        detalhes.textContent =
            `${movimento.categoria} • ${formatarData(movimento.data)}`;

        info.append(descricao, detalhes);

        const valor = document.createElement("strong");

        valor.className =
            movimento.tipo === "receita"
                ? "valor-receita"
                : "valor-gasto";

        valor.textContent =
            (movimento.tipo === "receita" ? "+ " : "- ") +
            formatarMoeda(movimento.valor);

        linha.append(info, valor);
        lista.appendChild(linha);
    }
}

async function carregarReceita() {
    try {
        const dados = await chamarAPI();

        $("ganhos-mes").textContent =
            formatarMoeda(dados.ganhosMes);

        $("gastos-mes").textContent =
            formatarMoeda(dados.gastosMes);

        $("saldo-mes").textContent =
            formatarMoeda(dados.saldoMes);

        $("ganhos-descricao").textContent =
            Number(dados.ganhosMes) > 0
                ? "Total recebido neste mês"
                : "Nenhum ganho cadastrado";

        $("gastos-descricao").textContent =
            Number(dados.gastosMes) > 0
                ? "Total gasto neste mês"
                : "Nenhum gasto cadastrado";

        estado.movimentacoes =
            Array.isArray(dados.movimentacoes)
                ? dados.movimentacoes
                : [];

        renderizarMovimentacoes();

    } catch (erro) {
        console.error("Erro ao carregar receita:", erro);

        mostrarVazio(
            "Não foi possível carregar as movimentações",
            erro.message
        );
    }
}

// CADASTRAR GANHO OU GASTO

async function salvarMovimentacao(evento) {
    evento.preventDefault();

    const valor = converterValor($("valor").value);
    const descricao = $("descricao").value.trim();
    const data = $("data").value;
    const forma = $("forma").value;
    const recorrente = $("recorrente").checked;

    if (!Number.isFinite(valor) || valor <= 0) {
        alert("Informe um valor válido.");
        return;
    }

    if (!descricao) {
        alert("Informe uma descrição.");
        return;
    }

    if (!estado.categoria) {
        alert("Selecione uma categoria.");
        return;
    }

    if (!data || !forma) {
        alert("Preencha a data e a forma de pagamento.");
        return;
    }

    const botao = $("salvar-movimentacao");

    try {
        botao.disabled = true;
        botao.textContent = "Salvando...";

        const resultado = await chamarAPI({
            method: "POST",
            body: JSON.stringify({
                tipo: estado.tipo,
                valor,
                descricao,
                categoria: estado.categoria,
                data,
                forma,
                recorrente
            })
        });

        fecharModal();
        await carregarReceita();

        alert(resultado.mensagem || "Movimentação cadastrada!");

    } catch (erro) {
        console.error("Erro ao cadastrar:", erro);
        alert(erro.message);

    } finally {
        botao.disabled = false;
        botao.textContent =
            estado.tipo === "receita"
                ? "Salvar ganho"
                : "Salvar gasto";
    }
}

// INICIALIZAÇÃO

function iniciarReceita() {
    $("abrir-ganho").addEventListener("click", () => {
        abrirModal("receita");
    });

    $("abrir-gasto").addEventListener("click", () => {
        abrirModal("gasto");
    });

    $("fechar-modal").addEventListener("click", fecharModal);
    $("cancelar-modal").addEventListener("click", fecharModal);

    $("modal-overlay").addEventListener("click", (evento) => {
        if (evento.target === $("modal-overlay")) {
            fecharModal();
        }
    });

    $("form-movimentacao").addEventListener(
        "submit",
        salvarMovimentacao
    );

    document.querySelectorAll("[data-filtro]").forEach((botao) => {
        botao.addEventListener("click", () => {
            const filtro = botao.dataset.filtro;

            estado.filtro =
                filtro === "ganhos" ? "receita" :
                    filtro === "gastos" ? "gasto" :
                        "tudo";

            document.querySelectorAll("[data-filtro]").forEach((item) => {
                item.classList.remove("selected");
            });

            botao.classList.add("selected");
            renderizarMovimentacoes();
        });
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fecharModal();
        }
    });

    carregarReceita();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarReceita);
} else {
    iniciarReceita();
}
