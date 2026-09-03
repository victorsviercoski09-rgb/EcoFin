const botaoRegistrar = document.querySelector(".btn-registrar");
const listaAcoes = document.querySelector("#lista-acoes");

let acoes = JSON.parse(localStorage.getItem("acoes")) || [];

const categoriasInfo = {
    agua: {
        nome: "Água",
        icone: "💧"
    },
    residuos: {
        nome: "Resíduos",
        icone: "♻"
    },
    natureza: {
        nome: "Natureza",
        icone: "🌳"
    },
    mobilidade: {
        nome: "Mobilidade",
        icone: "🚲"
    },
    energia: {
        nome: "Energia",
        icone: "⚡"
    }
};

function salvarAcoes() {
    localStorage.setItem("acoes", JSON.stringify(acoes));
}

function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

function textoData(data) {
    const hoje = new Date();

    const hojeSemHora = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    const dataSemHora = new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
    );

    const diferenca =
        (hojeSemHora - dataSemHora) /
        (1000 * 60 * 60 * 24);

    if (diferenca === 0) {
        return "Hoje";
    }

    if (diferenca === 1) {
        return "Ontem";
    }

    return formatarData(data);
}

function atualizarResumo() {
    Object.keys(categoriasInfo).forEach(categoria => {
        const elemento = document.querySelector(
            `.categoria.${categoria}`
        );

        if (!elemento) {
            return;
        }

        const quantidade = acoes.filter(
            acao => acao.categoria === categoria
        ).length;

        const contador = elemento.querySelector("strong");

        if (contador) {
            contador.textContent = quantidade;
        }
    });
}

function criarAcaoHTML(acao) {
    const data = new Date(acao.data);
    const categoria = categoriasInfo[acao.categoria];

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>
            <div class="data">
                <strong>${textoData(data)}</strong>
                <span>${formatarData(data)}</span>
            </div>
        </td>

        <td>
            <div class="acao-info">
                <span class="acao-icon ${acao.categoria}-icon">
                    ${categoria.icone}
                </span>

                <div>
                    <strong>${acao.nome}</strong>

                    <span>
                        ${acao.descricao || "Ação registrada pelo usuário."}
                    </span>
                </div>
            </div>
        </td>

        <td>
            <span class="tag ${acao.categoria}-tag">
                ${categoria.icone} ${categoria.nome}
            </span>
        </td>

        <td>
            ${acao.quantidade}
        </td>

        <td class="impacto">
            + R$ ${acao.impacto}
        </td>

        <td>
            <button
                class="acao-menu"
                type="button"
                aria-label="Opções da ação"
                data-id="${acao.id}">
                ⋮
            </button>
        </td>
    `;

    return tr;
}

function renderizarAcoes() {
    listaAcoes.innerHTML = "";

    acoes.forEach(acao => {
        listaAcoes.appendChild(
            criarAcaoHTML(acao)
        );
    });

    atualizarResumo();
}

function abrirModal() {
    const modal = document.createElement("div");

    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal">

            <div class="modal-header">

                <div>
                    <h2>Registrar ação</h2>
                    <p>Registre uma atitude sustentável que você realizou.</p>
                </div>

                <button
                    type="button"
                    class="fechar-modal"
                    aria-label="Fechar">
                    ×
                </button>

            </div>

            <form id="form-acao">

                <div class="campo">

                    <label for="nome-acao">
                        Ação realizada
                    </label>

                    <input
                        id="nome-acao"
                        type="text"
                        placeholder="Ex: Separei materiais recicláveis"
                        required>

                </div>

                <div class="campo">

                    <label for="categoria-acao">
                        Categoria
                    </label>

                    <select
                        id="categoria-acao"
                        required>

                        <option value="">
                            Selecione uma categoria
                        </option>

                        <option value="agua">
                            💧 Água
                        </option>

                        <option value="residuos">
                            ♻ Resíduos
                        </option>

                        <option value="natureza">
                            🌳 Natureza
                        </option>

                        <option value="mobilidade">
                            🚲 Mobilidade
                        </option>

                        <option value="energia">
                            ⚡ Energia
                        </option>

                    </select>

                </div>

                <div class="campo">

                    <label for="quantidade-acao">
                        Quantidade
                    </label>

                    <input
                        id="quantidade-acao"
                        type="text"
                        placeholder="Ex: 3 kg"
                        required>

                </div>

                <div class="campo">

                    <label for="impacto-acao">
                        Impacto estimado
                    </label>

                    <input
                        id="impacto-acao"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 1.20"
                        required>

                </div>

                <div class="campo">

                    <label for="descricao-acao">
                        Descrição
                    </label>

                    <textarea
                        id="descricao-acao"
                        rows="3"
                        placeholder="Conte brevemente o que você fez..."></textarea>

                </div>

                <div class="modal-botoes">

                    <button
                        type="button"
                        class="btn-cancelar">
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-salvar-acao">
                        Registrar ação
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    const formulario = modal.querySelector("#form-acao");
    const fechar = modal.querySelector(".fechar-modal");
    const cancelar = modal.querySelector(".btn-cancelar");

    function fecharModal() {
        modal.remove();
    }

    fechar.addEventListener("click", fecharModal);

    cancelar.addEventListener("click", fecharModal);

    modal.addEventListener("click", evento => {
        if (evento.target === modal) {
            fecharModal();
        }
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const nome = modal
            .querySelector("#nome-acao")
            .value
            .trim();

        const categoria = modal
            .querySelector("#categoria-acao")
            .value;

        const quantidade = modal
            .querySelector("#quantidade-acao")
            .value
            .trim();

        const impacto = Number(
            modal
                .querySelector("#impacto-acao")
                .value
        );

        const descricao = modal
            .querySelector("#descricao-acao")
            .value
            .trim();

        const novaAcao = {
            id: Date.now(),
            nome,
            categoria,
            quantidade,
            impacto: impacto.toFixed(2).replace(".", ","),
            descricao,
            data: new Date().toISOString()
        };

        acoes.unshift(novaAcao);

        salvarAcoes();

        renderizarAcoes();

        fecharModal();
    });

    setTimeout(() => {
        modal.querySelector("#nome-acao").focus();
    }, 50);
}

botaoRegistrar.addEventListener("click", abrirModal);

listaAcoes.addEventListener("click", evento => {
    const botao = evento.target.closest(".acao-menu");

    if (!botao) {
        return;
    }

    const id = Number(botao.dataset.id);

    const confirmar = confirm(
        "Deseja excluir esta ação?"
    );

    if (!confirmar) {
        return;
    }

    acoes = acoes.filter(
        acao => acao.id !== id
    );

    salvarAcoes();

    renderizarAcoes();
});

renderizarAcoes();