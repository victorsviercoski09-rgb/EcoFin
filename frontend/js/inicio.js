const btnMudarNome = document.getElementById("btn-mudar-nome");
const btnMudarSenha = document.getElementById("btn-mudar-senha");
const btnSobreSite = document.getElementById("btn-sobre-site");
const btnLogoff = document.getElementById("btn-logoff");

const modalMudarNome = document.getElementById("modal-mudar-nome");
const modalMudarSenha = document.getElementById("modal-mudar-senha");
const modalSobreSite = document.getElementById("modal-sobre-site");
const modalLogoff = document.getElementById("modal-logoff");

const btnAcoes = document.getElementById("btn-acoes");
const btnAprendizagem = document.getElementById("btn-aprendizagem");
const btnFinanceiro = document.getElementById("btn-financeiro");
const btnModoFinanceiro = document.getElementById("btn-modo-financeiro");

const confirmarLogoff = document.getElementById("confirmar-logoff");

const formMudarNome = document.getElementById("form-mudar-nome");
const formMudarSenha = document.getElementById("form-mudar-senha");

const usernamePrincipal = document.getElementById("username-principal");
const usernamePopup = document.getElementById("username-popup");

function abrirModal(modal) {
    if (!modal) return;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
}

function fecharModal(modal) {
    if (!modal) return;

    modal.hidden = true;
    document.body.style.overflow = "";
}

function fecharTodosModais() {
    document.querySelectorAll(".modal").forEach((modal) => {
        modal.hidden = true;
    });

    document.body.style.overflow = "";
}

btnMudarNome?.addEventListener("click", () => {
    fecharTodosModais();
    abrirModal(modalMudarNome);

    document.getElementById("novo-username")?.focus();
});

formMudarNome?.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = document.getElementById("novo-username");
    const novoNome = input.value.trim();

    if (!novoNome) {
        alert("Digite um nome de usuário.");
        return;
    }

    localStorage.setItem("username", novoNome);

    if (usernamePrincipal) {
        usernamePrincipal.textContent = novoNome;
    }

    if (usernamePopup) {
        usernamePopup.textContent = novoNome;
    }

    input.value = "";

    fecharModal(modalMudarNome);

    alert("Nome de usuário alterado!");
});

btnMudarSenha?.addEventListener("click", () => {
    fecharTodosModais();
    abrirModal(modalMudarSenha);

    document.getElementById("senha-atual")?.focus();
});

formMudarSenha?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const senhaAtual = document.getElementById("senha-atual").value;
    const novaSenha = document.getElementById("nova-senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        alert("Preencha todos os campos.");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alert("As novas senhas não são iguais.");
        return;
    }

    if (novaSenha.length < 8) {
        alert("A nova senha deve ter pelo menos 8 caracteres.");
        return;
    }

    const armazenamentoUsuario = localStorage.getItem("ecofinUsuario") || sessionStorage.getItem("ecofinUsuario");

    if (!armazenamentoUsuario) {
        alert("Usuário não encontrado. Faça login novamente.");
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(armazenamentoUsuario);
    } catch (erro) {
        alert("Não foi possível identificar o usuário. Faça login novamente.");
        return;
    }

    if (!usuario?.id) {
        alert("Não foi possível identificar o usuário. Faça login novamente.");
        return;
    }

    const botao = formMudarSenha.querySelector('button[type="submit"]');

    try {
        if (botao) {
            botao.disabled = true;
            botao.textContent = "Alterando...";
        }

        const resposta = await fetch("/api/usuarios/senha", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idUsuario: usuario.id,
                senhaAtual,
                novaSenha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem || "Não foi possível alterar a senha.");
            return;
        }

        document.getElementById("senha-atual").value = "";
        document.getElementById("nova-senha").value = "";
        document.getElementById("confirmar-senha").value = "";

        fecharModal(modalMudarSenha);

        alert("Senha alterada com sucesso!");
    } catch (erro) {
        console.error("Erro ao alterar senha:", erro);
        alert("Não foi possível conectar ao servidor.");
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = "Alterar senha";
        }
    }
});

btnSobreSite?.addEventListener("click", () => {
    fecharTodosModais();
    abrirModal(modalSobreSite);
});

btnLogoff?.addEventListener("click", () => {
    fecharTodosModais();
    abrirModal(modalLogoff);
});

confirmarLogoff?.addEventListener("click", () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("ecofinUsuario");
    sessionStorage.removeItem("ecofinUsuario");
    window.location.href = "login.html";
});

document.querySelectorAll("[data-fechar-modal]").forEach((botao) => {
    botao.addEventListener("click", () => {
        const modal = botao.closest(".modal");
        fecharModal(modal);
    });
});

document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            fecharModal(modal);
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    document.querySelectorAll(".modal").forEach((modal) => {
        if (!modal.hidden) {
            fecharModal(modal);
        }
    });
});

btnAcoes?.addEventListener("click", () => {
    window.location.href = "açoes.html";
});

btnAprendizagem?.addEventListener("click", () => {
    window.location.href = "aprendizagem.html";
});

btnFinanceiro?.addEventListener("click", () => {
    window.location.href = "inicioFinance.html";
});

btnModoFinanceiro?.addEventListener("click", () => {
    window.location.href = "inicioFinance.html";
});

const inputFotoPrincipal = document.getElementById("input-foto-principal");
const inputFotoPopup = document.getElementById("input-foto-perfil");

const fotoPrincipal = document.getElementById("foto-perfil-principal");
const fotoPopup = document.getElementById("foto-perfil-popup");

function atualizarFoto(input) {
    if (!input.files || !input.files[0]) {
        return;
    }

    const arquivo = input.files[0];

    if (!arquivo.type.startsWith("image/")) {
        alert("Selecione uma imagem válida.");
        return;
    }

    const leitor = new FileReader();

    leitor.onload = (event) => {
        const imagem = event.target.result;

        localStorage.setItem("fotoPerfil", imagem);

        if (fotoPrincipal) {
            fotoPrincipal.src = imagem;
        }

        if (fotoPopup) {
            fotoPopup.src = imagem;
        }
    };

    leitor.readAsDataURL(arquivo);
}

inputFotoPrincipal?.addEventListener("change", () => {
    atualizarFoto(inputFotoPrincipal);
});

inputFotoPopup?.addEventListener("change", () => {
    atualizarFoto(inputFotoPopup);
});

document.addEventListener("DOMContentLoaded", () => {
    const nomeSalvo = localStorage.getItem("username");
    const fotoSalva = localStorage.getItem("fotoPerfil");

    const armazenamentoUsuario = localStorage.getItem("ecofinUsuario") || sessionStorage.getItem("ecofinUsuario");

    if (!nomeSalvo && armazenamentoUsuario) {
        try {
            const usuario = JSON.parse(armazenamentoUsuario);

            if (usuario?.usuario) {
                if (usernamePrincipal) {
                    usernamePrincipal.textContent = usuario.usuario;
                }

                if (usernamePopup) {
                    usernamePopup.textContent = usuario.usuario;
                }
            }
        } catch (erro) {
            console.error("Erro ao carregar usuário:", erro);
        }
    }

    if (nomeSalvo) {
        if (usernamePrincipal) {
            usernamePrincipal.textContent = nomeSalvo;
        }

        if (usernamePopup) {
            usernamePopup.textContent = nomeSalvo;
        }
    }

    if (fotoSalva) {
        if (fotoPrincipal) {
            fotoPrincipal.src = fotoSalva;
        }

        if (fotoPopup) {
            fotoPopup.src = fotoSalva;
        }
    }
});