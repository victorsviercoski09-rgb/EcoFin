const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });
const app = express();
const PORT = Number(process.env.PORT) || 3000;

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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
app.get("/api/teste-db", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.json({ mensagem: "Banco de dados conectado." });
    } catch (erro) {
        console.error("Erro ao conectar ao banco:", erro.message);
        res.status(500).json({ mensagem: "Não foi possível conectar ao banco de dados." });
    }
});

app.post("/api/usuarios/cadastro", async (req, res) => {
    try {
        const { nomeCompleto, email, usuario, senha, confirmarSenha } = req.body;
        const emailNormalizado = typeof email === "string" ? normalizarEmail(email) : "";
        const usuarioNormalizado = typeof usuario === "string" ? usuario.trim() : "";

        if (!textoValido(nomeCompleto, 120) || !textoValido(email, 150) || !textoValido(usuario, 30) || !textoValido(senha, 72) || !textoValido(confirmarSenha, 72)) {
            return res.status(400).json({ mensagem: "Preencha todos os campos corretamente." });
        }
        if (!/^\S+@\S+\.\S+$/.test(emailNormalizado)) {
            return res.status(400).json({ mensagem: "Informe um e-mail válido." });
        }
        if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(usuarioNormalizado)) {
            return res.status(400).json({ mensagem: "O usuário deve ter 3 a 30 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado." });
        }
        if (senha.length < 8) {
            return res.status(400).json({ mensagem: "A senha deve ter pelo menos 8 caracteres." });
        }
        if (senha !== confirmarSenha) {
            return res.status(400).json({ mensagem: "As senhas não coincidem." });
        }

        const [existente] = await db.execute(
            "SELECT id_usuario FROM usuarios WHERE email = ? OR nome_usuario = ? LIMIT 1",
            [emailNormalizado, usuarioNormalizado]
        );
        if (existente.length > 0) {
            return res.status(409).json({ mensagem: "E-mail ou nome de usuário já cadastrado." });
        }

        const senhaHash = await bcrypt.hash(senha, 12);
        const [resultado] = await db.execute(
            `INSERT INTO usuarios (nome_completo, nome_usuario, email, senha_hash)
             VALUES (?, ?, ?, ?)`,
            [nomeCompleto.trim(), usuarioNormalizado, emailNormalizado, senhaHash]
        );
        res.status(201).json({
            mensagem: "Cadastro realizado com sucesso! Agora você pode entrar.",
            usuario: { id: resultado.insertId, nome: nomeCompleto.trim(), usuario: usuarioNormalizado }
        });
    } catch (erro) {
        console.error("Erro no cadastro:", erro.message);
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
        const [usuarios] = await db.execute(
            `SELECT id_usuario, nome_completo, nome_usuario, email, senha_hash
             FROM usuarios WHERE email = ? OR nome_usuario = ? LIMIT 1`,
            [normalizarEmail(valor), valor]
        );
        const usuario = usuarios[0];
        if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
            return res.status(401).json({ mensagem: "E-mail/usuário ou senha inválidos." });
        }

        res.json({
            mensagem: "Login realizado com sucesso!",
            usuario: { id: usuario.id_usuario, nome: usuario.nome_completo, usuario: usuario.nome_usuario, email: usuario.email }
        });
    } catch (erro) {
        console.error("Erro no login:", erro.message);
        res.status(500).json({ mensagem: "Erro interno ao realizar o login." });
    }
});

app.use((req, res) => res.status(404).json({ mensagem: "Rota não encontrada." }));
app.listen(PORT, () => console.log(`EcoFin disponível em http://localhost:${PORT}`));
