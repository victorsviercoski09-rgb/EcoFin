const modal = document.querySelector("#modal-aprendizagem");
const conteudoModal = document.querySelector("#conteudo-modal");
const etapasVisitadas = new Set(JSON.parse(localStorage.getItem("ecofinEtapasReciclagem")) || []);

const conteudos = {
    conceito: {
        titulo: "♻️ O que é reciclagem?",
        corpo: `<p class="abertura">Reciclar é transformar um material que seria descartado em matéria-prima para criar algo novo.</p>
        <div class="cards-info"><article><span>REDUZIR</span><p>Evite gerar lixo: compre somente o necessário e prefira menos embalagens.</p></article><article><span>REUTILIZAR</span><p>Use novamente antes de descartar: potes, sacolas e roupas podem ter novas funções.</p></article><article><span>RECICLAR</span><p>Encaminhe materiais para que sejam processados e virem novos produtos.</p></article></div>
        <h3>Por que isso importa?</h3><ul><li>Reduz a quantidade de resíduos em aterros e na natureza.</li><li>Economiza recursos naturais, água e energia.</li><li>Ajuda a diminuir a poluição e apoia cooperativas de reciclagem.</li></ul><p class="dica">💡 Depois da coleta e triagem, uma garrafa PET pode virar fibra para roupas, vassouras ou uma nova embalagem.</p>`
    },
    separacao: {
        titulo: "🗑️ Como separar o lixo",
        corpo: `<p class="abertura">O primeiro passo é separar os resíduos secos dos orgânicos e rejeitos. Materiais limpos e secos têm mais chance de serem reciclados.</p>
        <div class="lixeiras"><article class="papel"><b>🟦 Papel</b><span>jornais, caixas, cadernos sem espiral</span></article><article class="plastico"><b>🟥 Plástico</b><span>garrafas PET, potes, embalagens limpas</span></article><article class="vidro"><b>🟩 Vidro</b><span>garrafas, frascos e potes</span></article><article class="metal"><b>🟨 Metal</b><span>latas, tampas e embalagens metálicas</span></article></div>
        <h3>Antes de descartar</h3><ul><li>Esvazie e lave embalagens para remover restos de comida.</li><li>Deixe os materiais secarem; umidade pode estragar papel e papelão.</li><li>Não misture lixo de banheiro, papel engordurado, fraldas ou restos de comida com recicláveis.</li><li>Embrulhe vidros quebrados e identifique o pacote para evitar acidentes.</li></ul>`
    },
    guia: {
        titulo: "🔍 Onde cada material deve ir?",
        corpo: `<p class="abertura">Escolha um item e veja o destino indicado. Verifique sempre as regras da coleta seletiva da sua cidade.</p>
        <div class="guia-itens"><button data-item="pet">Garrafa PET</button><button data-item="lata">Lata de refrigerante</button><button data-item="jornal">Jornal</button><button data-item="vidro">Garrafa de vidro</button><button data-item="comida">Restos de comida</button><button data-item="pilhas">Pilhas</button></div><div id="resposta-guia" class="resposta">Clique em um item para descobrir o descarte correto.</div>`
    },
    processo: {
        titulo: "🌱 O que acontece depois do descarte?",
        corpo: `<p class="abertura">A reciclagem não termina quando você joga algo na lixeira. Veja o caminho do material até ganhar uma nova vida.</p>
        <div class="fluxo"><span>Descarte</span><i>→</i><span>Coleta</span><i>→</i><span>Triagem</span><i>→</i><span>Separação</span><i>→</i><span>Reciclagem</span><i>→</i><span>Novo produto</span></div>
        <div class="passos"><article><b>1. Coleta seletiva</b><p>O material é recolhido por serviços públicos, cooperativas ou pontos de entrega.</p></article><article><b>2. Triagem e separação</b><p>Os resíduos são organizados por tipo e os contaminados são retirados.</p></article><article><b>3. Processamento</b><p>Cada material é triturado, prensado ou derretido conforme sua composição.</p></article><article><b>4. Novo produto</b><p>Papel pode virar papelão; vidro, novas garrafas; plástico, fibras ou embalagens.</p></article></div>`
    },
    quiz: {
        titulo: "🎮 Teste seus conhecimentos",
        corpo: `<p class="abertura">Responda às cinco perguntas e descubra seu nível de reciclagem.</p><form id="quiz-reciclagem"></form><div id="resultado-quiz" class="resultado-quiz" hidden></div>`
    }
};

const guia = {
    pet: "🟥 Garrafa PET → Recicláveis → Plástico → Coleta seletiva.",
    lata: "🟨 Lata de refrigerante → Recicláveis → Metal → Coleta seletiva.",
    jornal: "🟦 Jornal → Recicláveis → Papel → Coleta seletiva.",
    vidro: "🟩 Garrafa de vidro → Recicláveis → Vidro → Coleta seletiva. Embale se estiver quebrada.",
    comida: "🍌 Restos de comida → Orgânico → Compostagem ou coleta comum, conforme sua cidade.",
    pilhas: "🔋 Pilhas → Ponto de coleta específico. Nunca descarte no lixo comum."
};

const perguntas = [
    ["Onde devemos descartar uma lata de alumínio?", ["Papel", "Plástico", "Metal", "Orgânico"], 2, "Latas são materiais metálicos e devem ir para a coleta seletiva."],
    ["Qual atitude vem antes de reciclar?", ["Reduzir o consumo", "Jogar tudo no lixo comum", "Misturar restos de comida", "Quebrar embalagens"], 0, "Reduzir evita que o resíduo seja gerado."],
    ["O que fazer com uma embalagem reciclável suja?", ["Lavar e secar", "Misturar com orgânico", "Queimar", "Descartar no vaso sanitário"], 0, "Restos de alimento contaminam os recicláveis."],
    ["Para onde vão pilhas usadas?", ["Papel", "Ponto de coleta específico", "Compostagem", "Vidro"], 1, "Pilhas têm componentes que exigem logística reversa."],
    ["O que ocorre após a coleta seletiva?", ["Triagem e separação", "O material desaparece", "Vai direto para o oceano", "É sempre queimado"], 0, "Na triagem, os materiais são separados antes do processamento."]
];

function atualizarProgresso() {
    const total = Object.keys(conteudos).length;
    document.querySelector("#progresso-texto").textContent = `${etapasVisitadas.size} de ${total} etapas exploradas`;
    document.querySelector("#progresso-barra").style.width = `${(etapasVisitadas.size / total) * 100}%`;
}

function montarQuiz() {
    const form = document.querySelector("#quiz-reciclagem");
    form.innerHTML = perguntas.map(([pergunta, opcoes], indice) => `<fieldset><legend>${indice + 1}. ${pergunta}</legend>${opcoes.map((opcao, opcaoIndice) => `<label><input type="radio" name="q${indice}" value="${opcaoIndice}"> ${String.fromCharCode(65 + opcaoIndice)}) ${opcao}</label>`).join("")}</fieldset>`).join("") + `<button class="botao-modal" type="submit">Ver meu resultado</button>`;
    form.addEventListener("submit", corrigirQuiz);
}

function corrigirQuiz(evento) {
    evento.preventDefault();
    let acertos = 0;
    const explicacoes = perguntas.map(([pergunta, , correta, explicacao], indice) => {
        const escolha = new FormData(evento.currentTarget).get(`q${indice}`);
        const acertou = Number(escolha) === correta;
        if (acertou) acertos++;
        return `<li class="${acertou ? "acertou" : "errou"}"><b>${acertou ? "✓" : "•"} ${pergunta}</b><br>${explicacao}</li>`;
    });
    const nivel = acertos <= 2 ? "Iniciante" : acertos <= 4 ? "Intermediário" : "Mestre da Reciclagem";
    const resultado = document.querySelector("#resultado-quiz");
    resultado.hidden = false;
    resultado.innerHTML = `<h3>${acertos}/5 — ${nivel}</h3><p>${acertos === 5 ? "Excelente! Você conhece bem os caminhos da reciclagem." : "Continue explorando as etapas e tente novamente quando quiser."}</p><ul>${explicacoes.join("")}</ul>`;
    resultado.scrollIntoView({ behavior: "smooth", block: "start" });
}

function abrirModal(chave) {
    const secao = conteudos[chave];
    conteudoModal.innerHTML = `<h2 id="titulo-modal">${secao.titulo}</h2>${secao.corpo}`;
    etapasVisitadas.add(chave);
    localStorage.setItem("ecofinEtapasReciclagem", JSON.stringify([...etapasVisitadas]));
    atualizarProgresso();
    modal.showModal();
    if (chave === "quiz") montarQuiz();
    if (chave === "guia") document.querySelectorAll(".guia-itens button").forEach((botao) => botao.addEventListener("click", () => document.querySelector("#resposta-guia").textContent = guia[botao.dataset.item]));
}

document.querySelectorAll("[data-modal]").forEach((botao) => botao.addEventListener("click", () => abrirModal(botao.dataset.modal)));
document.querySelector(".fechar").addEventListener("click", () => modal.close());
modal.addEventListener("click", (evento) => { if (evento.target === modal) modal.close(); });
atualizarProgresso();
