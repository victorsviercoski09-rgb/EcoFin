
const formularioLogin = document.querySelector("#loginForm");
const campoSenha = document.querySelector("#senha");
const botaoMostrarSenha = document.querySelector("#togglePassword");

// Mostrar e ocultar senha
botaoMostrarSenha?.addEventListener("click", () => {
    const senhaVisivel = campoSenha.type === "text";

    campoSenha.type = senhaVisivel ? "password" : "text";

    botaoMostrarSenha.setAttribute(
        "aria-label",
        senhaVisivel ? "Mostrar senha" : "Ocultar senha"
    );
});

// Realizar login
formularioLogin?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const identificador = document.querySelector("#email").value.trim();
    const senha = campoSenha.value;
    const lembrar = document.querySelector("#lembrar")?.checked ?? false;
    const botao = formularioLogin.querySelector('button[type="submit"]');

    if (!identificador || !senha) {
        alert("Informe seu e-mail ou usuário e sua senha.");
        return;
    }

    try {
        botao.disabled = true;
        botao.textContent = "Entrando...";

        const resposta = await fetch("/api/usuarios/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identificador,
                senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem || "Não foi possível entrar.");
            return;
        }

        // Confirma se o backend retornou o token.
        if (
            typeof dados.token !== "string" ||
            !/^[a-f0-9]{64}$/i.test(dados.token)
        ) {
            console.error("Token de autenticação ausente ou inválido.");

            alert(
                "O servidor não retornou um token válido. Verifique a rota de login no backend."
            );
            return;
        }

        // Limpa possíveis sessões antigas.
        localStorage.removeItem("ecofinUsuario");
        sessionStorage.removeItem("ecofinUsuario");

        localStorage.removeItem("ecofin_token");
        sessionStorage.removeItem("ecofin_token");

        // Salva os dados conforme a opção Lembrar-me.
        const armazenamento = lembrar
            ? localStorage
            : sessionStorage;

        armazenamento.setItem(
            "ecofinUsuario",
            JSON.stringify(dados.usuario)
        );

        // A página Receita utiliza esta chave para autenticação.
        localStorage.setItem("ecofin_token", dados.token);

        console.log("Login realizado com sucesso!");

        // Mantém seu redirecionamento original.
        window.location.href = "inicio.html";

    } catch (erro) {
        console.error("Erro no login:", erro);

        alert("Não foi possível conectar ao servidor.");

    } finally {
        botao.disabled = false;
        botao.innerHTML = "<span>♧</span> Entrar";
    }
});
