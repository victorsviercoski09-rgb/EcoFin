const formularioLogin = document.querySelector("#loginForm");
const campoSenha = document.querySelector("#senha");
const botaoMostrarSenha = document.querySelector("#togglePassword");

botaoMostrarSenha?.addEventListener("click", () => {
    const senhaVisivel = campoSenha.type === "text";
    campoSenha.type = senhaVisivel ? "password" : "text";
    botaoMostrarSenha.setAttribute("aria-label", senhaVisivel ? "Mostrar senha" : "Ocultar senha");
});

formularioLogin?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const identificador = document.querySelector("#email").value.trim();
    const senha = campoSenha.value;
    const lembrar = document.querySelector("#lembrar").checked;
    const botao = formularioLogin.querySelector('button[type="submit"]');
    if (!identificador || !senha) return alert("Informe seu e-mail ou usuário e sua senha.");

    try {
        botao.disabled = true;
        botao.textContent = "Entrando...";
        const resposta = await fetch("/api/usuarios/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identificador, senha })
        });
        const dados = await resposta.json();
        if (!resposta.ok) return alert(dados.mensagem || "Não foi possível entrar.");
        const armazenamento = lembrar ? localStorage : sessionStorage;
        armazenamento.setItem("ecofinUsuario", JSON.stringify(dados.usuario));
        window.location.href = "inicio.html";
    } catch (erro) {
        console.error("Erro no login:", erro);
        alert("Não foi possível conectar ao servidor.");
    } finally {
        botao.disabled = false;
        botao.innerHTML = "<span>♧</span> Entrar";
    }
});
