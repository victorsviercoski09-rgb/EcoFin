const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const db = new Database(path.join(__dirname, "ecofin.db"));
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_completo TEXT NOT NULL,
        nome_usuario TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

function textoValido(valor, tamanhoMaximo) {
    return typeof valor === "string" && valor.trim().length > 0 && valor.trim().length <= tamanhoMaximo;
}

function normalizarEmail(email) {
    return email.trim().toLowerCase();
}

app.get("/", (req, res) => {
    res.redirect("/pages/cadastro.html");
});

app.get("/api/teste-db", (req, res) => {
    try {
        db.prepare("SELECT 1").get();
        res.json({ mensagem: "Banco de dados conectado." });
    } catch (erro) {
        console.error("Erro ao conectar ao banco:", erro);
        res.status(500).json({ mensagem: "Não foi possível conectar ao banco de dados." });
    }
});

app.post("/api/usuarios/cadastro", async (req, res) => {
    try {
        const { nomeCompleto, email, usuario, senha, confirmarSenha } = req.body;

        const emailNormalizado = typeof email === "string" ? normalizarEmail(email) : "";
        const usuarioNormalizado = typeof usuario === "string" ? usuario.trim() : "";

        if (
            !textoValido(nomeCompleto, 120) ||
            !textoValido(email, 150) ||
            !textoValido(usuario, 30) ||
            !textoValido(senha, 72) ||
            !textoValido(confirmarSenha, 72)
        ) {
            return res.status(400).json({ mensagem: "Preencha todos os campos corretamente." });
        }

        if (!/^\S+@\S+\.\S+$/.test(emailNormalizado)) {
            return res.status(400).json({ mensagem: "Informe um e-mail válido." });
        }

        if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(usuarioNormalizado)) {
            return res.status(400).json({
                mensagem: "O usuário deve ter 3 a 30 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado."
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({ mensagem: "A senha deve ter pelo menos 8 caracteres." });
        }

        if (senha !== confirmarSenha) {
            return res.status(400).json({ mensagem: "As senhas não coincidem." });
        }

        const existente = db
            .prepare("SELECT id_usuario FROM usuarios WHERE email = ? OR nome_usuario = ? LIMIT 1")
            .get(emailNormalizado, usuarioNormalizado);

        if (existente) {
            return res.status(409).json({ mensagem: "E-mail ou nome de usuário já cadastrado." });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const resultado = db
            .prepare("INSERT INTO usuarios (nome_completo, nome_usuario, email, senha_hash) VALUES (?, ?, ?, ?)")
            .run(nomeCompleto.trim(), usuarioNormalizado, emailNormalizado, senhaHash);

        res.status(201).json({
            mensagem: "Cadastro realizado com sucesso! Agora você pode entrar.",
            usuario: {
                id: Number(resultado.lastInsertRowid),
                nome: nomeCompleto.trim(),
                usuario: usuarioNormalizado
            }
        });
    } catch (erro) {
        console.error("Erro no cadastro:", erro);
        res.status(500).json({ mensagem: "Erro interno ao realizar o cadastro." });
    }
});

app.post("/api/usuarios/login", async (req, res) => {
    try {
        const { identificador, senha } = req.body;

        if (!textoValido(identificador, 150) || !textoValido(senha, 72)) {
            return res.status(400).json({ mensagem: "Informe seu e-mail ou usuário e sua senha." });
        }

        const valor = identificador.trim();

        const usuario = db
            .prepare(`SELECT id_usuario, nome_completo, nome_usuario, email, senha_hash
                      FROM usuarios
                      WHERE email = ? OR nome_usuario = ?
                      LIMIT 1`)
            .get(normalizarEmail(valor), valor);

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
            return res.status(401).json({ mensagem: "E-mail/usuário ou senha inválidos." });
        }

        res.json({
            mensagem: "Login realizado com sucesso!",
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome_completo,
                usuario: usuario.nome_usuario,
                email: usuario.email
            }
        });
    } catch (erro) {
        console.error("Erro no login:", erro);
        res.status(500).json({ mensagem: "Erro interno ao realizar o login." });
    }
});

app.put("/api/usuarios/senha", async (req, res) => {
    try {
        const { idUsuario, senhaAtual, novaSenha } = req.body;

        const id = Number(idUsuario);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: "Usuário inválido." });
        }

        if (!textoValido(senhaAtual, 72) || !textoValido(novaSenha, 72)) {
            return res.status(400).json({ mensagem: "Preencha todos os campos corretamente." });
        }

        if (novaSenha.length < 8) {
            return res.status(400).json({ mensagem: "A nova senha deve ter pelo menos 8 caracteres." });
        }

        const usuario = db
            .prepare("SELECT senha_hash FROM usuarios WHERE id_usuario = ? LIMIT 1")
            .get(id);

        if (!usuario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        const senhaAtualCorreta = await bcrypt.compare(senhaAtual, usuario.senha_hash);

        if (!senhaAtualCorreta) {
            return res.status(401).json({ mensagem: "A senha atual está incorreta." });
        }

        const novaSenhaHash = await bcrypt.hash(novaSenha, 12);

        db.prepare("UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?").run(novaSenhaHash, id);

        res.json({ mensagem: "Senha alterada com sucesso!" });
    } catch (erro) {
        console.error("Erro ao alterar senha:", erro);
        res.status(500).json({ mensagem: "Erro interno ao alterar a senha." });
    }
});

app.use((req, res) => {
    res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.listen(PORT, () => {
    console.log(`EcoFin disponível em http://localhost:${PORT}`);
});