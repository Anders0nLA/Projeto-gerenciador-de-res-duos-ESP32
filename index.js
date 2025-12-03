const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const serviceAccount = require("./serviceAccountKey.json");

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
});

const db = admin.database();
const ref = db.ref("lixeira"); 
let ultimoEstado = {}; 

ref.on("value", (snapshot) => {
  const dados = snapshot.val();
  if (dados) {
    console.log("Firebase atualizou:", dados);
    ultimoEstado = dados;
    
    if (dados.tampaAberta) {
      console.log("Tampa ABERTA detectada");
    } else {
      console.log("Tampa FECHADA");
    }
  } else {
    console.log("Nada encontrado em /lixeira");
  }
});

app.get("/lixeira", (req, res) => {
  res.json(ultimoEstado);
});

app.get("/lixeira/status", (req, res) => {
  if (ultimoEstado.tampaAberta) {
    res.json({ 
      status: "tampa_aberta",
      mensagem: "Tampa da lixeira está aberta",
      tampaAberta: true
    });
  } else {
    res.json({
      status: ultimoEstado.status || "normal",
      mensagem: "Lixeira operando normalmente",
      tampaAberta: false
    });
  }
});

app.get("/lixeira/historico", async (req, res) => {
  try {
    const historicoRef = db.ref("historico");
    const snapshot = await historicoRef.orderByChild("timestamp").limitToLast(20).once("value");
    
    const historico = [];
    snapshot.forEach((child) => {
      historico.push(child.val());
    });
    
    res.json(historico.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});