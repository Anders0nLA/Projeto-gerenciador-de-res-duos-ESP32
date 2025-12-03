const firebaseConfig = {
  apiKey: "AIzaSyCA_rpt7ze_Yk-oYU1DaBtT1zlfThU6waE",
  authDomain: "gerenciador-de-residuos-cec4a.firebaseapp.com",
  databaseURL: "https://gerenciador-de-residuos-cec4a-default-rtdb.firebaseio.com",
  projectId: "gerenciador-de-residuos-cec4a",
  storageBucket: "gerenciador-de-residuos-cec4a.firebasestorage.app",
  messagingSenderId: "424025269545",
  appId: "1:424025269545:web:471cb3ad8d550514c10338"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function atualizarInterface(lixeira) {
  console.log('Dados recebidos:', lixeira);
  
  const progressFill = document.getElementById('progressFill');
  const nivelText = document.getElementById('nivelText');
  const statusText = document.getElementById('statusText');
  const localSpan = document.getElementById('local');
  const capacidadeSpan = document.getElementById('capacidade');
  const atualizadoEm = document.getElementById('atualizadoEm');
  const distanciaSpan = document.getElementById('distancia');
  const statusTampaSpan = document.getElementById('statusTampa');
  const tampaStatusDiv = document.getElementById('tampaStatus');

  const porcentagem = lixeira.porcentagem || 0;
  const status = lixeira.status || 'normal';
  const distancia = lixeira.distancia || 0;
  const tampaAberta = lixeira.tampaAberta || false;

  if (tampaAberta) {
    tampaStatusDiv.className = 'tampa-status tampa-aberta';
    tampaStatusDiv.innerHTML = '<i class="fas fa-lock-open"></i><span>Tampa Aberta</span>';
    statusTampaSpan.textContent = 'Aberta';
    statusTampaSpan.style.color = 'var(--tampa-aberta-color)';
    statusTampaSpan.style.fontWeight = 'bold';

    progressFill.style.width = '0%';
    progressFill.className = 'progress-fill';
    nivelText.textContent = 'Medição suspensa - Tampa aberta';
    statusText.textContent = 'Status: Tampa Aberta';
    statusText.className = 'status-label status-tampa_aberta';
  } else {
    tampaStatusDiv.className = 'tampa-status tampa-fechada';
    tampaStatusDiv.innerHTML = '<i class="fas fa-lock"></i><span>Tampa Fechada</span>';
    statusTampaSpan.textContent = 'Fechada';
    statusTampaSpan.style.color = 'var(--tampa-fechada-color)';

    progressFill.style.width = `${porcentagem}%`;
    progressFill.className = 'progress-fill';
    
    if (status === 'cheia') {
      progressFill.classList.add('progress-danger');
    } else if (status === 'quase_cheia') {
      progressFill.classList.add('progress-warning');
    } else {
      progressFill.classList.add('progress-normal');
    }

    nivelText.textContent = `${porcentagem.toFixed(1)}% da capacidade`;
    statusText.textContent = `Status: ${status.replace('_', ' ')}`;
    statusText.className = `status-label status-${status}`;
  }

  localSpan.textContent = lixeira.local || 'Sala 01';
  capacidadeSpan.textContent = `${lixeira.capacidade || 50} kg`;
  distanciaSpan.textContent = distancia.toFixed(1);
  
  if (lixeira.atualizadoEm) {
    const data = new Date(parseInt(lixeira.atualizadoEm));
    atualizadoEm.textContent = data.toLocaleString('pt-BR');
  } else {
    atualizadoEm.textContent = new Date().toLocaleString('pt-BR');
  }
}

const lixeiraRef = db.ref('lixeira'); 

lixeiraRef.on('value', (snapshot) => {
  const dados = snapshot.val();
  console.log('Dados do Firebase:', dados);
  
  if (dados) {
    document.getElementById('statusApi').innerHTML = '<i class="fas fa-circle"></i> Conectado';
    document.getElementById('statusApi').className = 'status-online';
    atualizarInterface(dados);
  } else {
    document.getElementById('statusApi').innerHTML = '<i class="fas fa-circle"></i> Sem dados';
    document.getElementById('statusApi').className = 'status-offline';
    console.log('Nenhum dado encontrado no Firebase');
  }
}, (error) => {
  console.error('Erro ao ler dados do Firebase:', error);
  document.getElementById('statusApi').innerHTML = '<i class="fas fa-circle"></i> Erro na conexão';
  document.getElementById('statusApi').className = 'status-offline';
});

lixeiraRef.once('value')
  .then((snapshot) => {
    if (!snapshot.exists()) {
      console.log('Nenhum dado inicial encontrado no Firebase');
    }
  })
  .catch((error) => {
    console.error('Erro na verificação inicial:', error);
  });