
const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

let movimentacoes = [];
let filtroAtual = "tudo";

const lista = document.getElementById("lista-movimentacoes");

const estadoVazioHTML = lista.innerHTML;

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = moeda.format(Number(valor) || 0);
  }
}

function formatarData(data) {
  const partes = String(data).slice(0, 10).split("-");

  if (partes.length !== 3) return String(data);

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function renderizarMovimentacoes() {
  const filtradas = movimentacoes.filter(item =>
    filtroAtual === "tudo" || item.tipo === filtroAtual
  );

  if (filtradas.length === 0) {
    lista.innerHTML = estadoVazioHTML;
    return;
  }

  lista.replaceChildren();

  filtradas.forEach(item => {
    const linha = document.createElement("div");
    linha.className = "movimentacao";

    const info = document.createElement("div");
    info.className = "movimentacao-info";

    const descricao = document.createElement("strong");
    descricao.textContent = item.descricao;

    const data = document.createElement("small");
    data.textContent = formatarData(item.data);

    info.append(descricao, data);

    const valor = document.createElement("span");
    const receita = item.tipo === "receita";

    valor.className = receita
      ? "valor-receita"
      : "valor-gasto";

    valor.textContent =
      `${receita ? "+" : "-"} ${moeda.format(Number(item.valor))}`;

    linha.append(info, valor);
    lista.appendChild(linha);
  });
}

async function carregarDashboard() {
  try {
    const token = localStorage.getItem("ecofin_token");

    const resposta = await fetch("/api/dashboard", {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {}
    });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();

    atualizarTexto("renda-mensal", dados.rendaMensal);
    atualizarTexto("saldo-disponivel", dados.saldoDisponivel);

    movimentacoes = Array.isArray(dados.movimentacoes)
      ? dados.movimentacoes
      : [];

    renderizarMovimentacoes();
  } catch (erro) {
    console.error("Erro ao carregar EcoFin:", erro);

    lista.textContent =
      "Não foi possível carregar os dados financeiros.";
    lista.className = "mensagem-vazia";
  }
}

document.querySelectorAll("[data-filtro]").forEach(botao => {
  botao.addEventListener("click", () => {
    filtroAtual = botao.dataset.filtro;

    document.querySelectorAll("[data-filtro]").forEach(outro => {
      outro.classList.toggle(
        "selected",
        outro === botao
      );
    });

    renderizarMovimentacoes();
  });
});

carregarDashboard();
