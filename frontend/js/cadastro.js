const formulario = document.querySelector(".formulario");

formulario?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nomeCompleto = document.querySelector("#nome").value.trim();
    const email = document.querySelector("#email").value.trim();
    const usuario = document.querySelector("#usuario").value.trim();
    const senha = document.querySelector("#senha").value;
    const confirmarSenha = document.querySelector("#confirmar-senha").value;
    const termos = document.querySelector("#termos").checked;
    const botao = formulario.querySelector('button[type="submit"]');

    if (!nomeCompleto || !email || !usuario || !senha || !confirmarSenha) return alert("Preencha todos os campos.");
    if (senha.length < 8) return alert("A senha deve ter pelo menos 8 caracteres.");
    if (senha !== confirmarSenha) return alert("As senhas não coincidem.");
    if (!termos) return alert("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");

    try {
        botao.disabled = true;
        botao.textContent = "Cadastrando...";
        const resposta = await fetch("/api/usuarios/cadastro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nomeCompleto, email, usuario, senha, confirmarSenha })
        });
        const dados = await resposta.json();
        if (!resposta.ok) return alert(dados.mensagem || "Não foi possível concluir o cadastro.");
        alert(dados.mensagem);
        window.location.href = "login.html";
    } catch (erro) {
        console.error("Erro no cadastro:", erro);
        alert("Não foi possível conectar ao servidor.");
    } finally {
        botao.disabled = false;
        botao.innerHTML = "<span>♧</span> Cadastrar";
    }
});
