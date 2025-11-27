(function() {
  // Configuração do Firebase
  var firebaseConfig = {
    apiKey: "AIzaSyAZN6yG-tW82RFa9NYDeShahMwgSCgADhg",
    authDomain: "consertaja-database.firebaseapp.com",
    databaseURL: "https://consertaja-database-default-rtdb.firebaseio.com",
    projectId: "consertaja-database",
    storageBucket: "consertaja-database.firebasestorage.app",
    messagingSenderId: "605508365980",
    appId: "1:605508365980:web:f34b895505b9b35edac759",
    measurementId: "G-HW4RM6RP06"
  };

  // Inicializa Firebase se ainda não estiver
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Mantém o Realtime Database funcionando
  var db = firebase.database();

  // 🔥 ATIVA O FIRESTORE AGORA
  var firestore = firebase.firestore();

  let donutChart = null;

  // -------------------------------
  // FUNÇÃO EXISTENTE — NÃO ALTERADA
  // -------------------------------
  function atualizarContadores() {
    db.ref("users").once("value").then(function(snapshot) {
      var totalCadastros = 0;
      var totalClientes = 0;
      var totalPaneleiros = 0;

      var ultimoCadastro = null;
      var ultimoCliente = null;
      var ultimoPaneleiro = null;

      snapshot.forEach(function(childSnapshot) {
        var user = childSnapshot.val();
        totalCadastros++;

        let conta = user.conta || {};
        let timestamp = conta.timestamp || 0;

        if (!ultimoCadastro || timestamp > (ultimoCadastro.conta?.timestamp || 0))
          ultimoCadastro = user;

        if (user.tipoUsuario === "Cliente") {
          totalClientes++;
          if (!ultimoCliente || timestamp > (ultimoCliente.conta?.timestamp || 0))
            ultimoCliente = user;
        }

        if (user.tipoUsuario === "Paneleiro") {
          totalPaneleiros++;
          if (!ultimoPaneleiro || timestamp > (ultimoPaneleiro.conta?.timestamp || 0))
            ultimoPaneleiro = user;
        }
      });

      document.getElementById("total-cadastros").textContent = totalCadastros;
      document.getElementById("total-clientes").textContent = totalClientes;
      document.getElementById("total-paneleiros").textContent = totalPaneleiros;

      document.getElementById("last-cadastro").innerHTML =
        "Último cadastro:<br>" + formatarData(ultimoCadastro?.conta);
      document.getElementById("last-cliente").innerHTML =
        "Último cadastro:<br>" + formatarData(ultimoCliente?.conta);
      document.getElementById("last-paneleiro").innerHTML =
        "Último cadastro:<br>" + formatarData(ultimoPaneleiro?.conta);

      atualizarGraficoPercentual(totalClientes, totalPaneleiros);
    });
  }

  function formatarData(conta) {
    if (!conta) return "-";
    if (conta.dataFormatada) return conta.dataFormatada;
    if (conta.dataCriacao) {
      try {
        var d = new Date(conta.dataCriacao);
        return d.toLocaleDateString('pt-BR', {
          year: 'numeric', month: 'short', day: 'numeric'
        }) + ' ' + d.toLocaleTimeString('pt-BR');
      } catch (e) {
        return "-";
      }
    }
    return "-";
  }

  // -------------------------------
  // 🔥 FUNÇÃO NOVA — FIRESTORE
  // -------------------------------
  function atualizarServicos() {
    firestore.collection("solicitacoes_servico").get()
      .then((querySnapshot) => {
        let total = querySnapshot.size;
        let ativos = 0;
        let concluidos = 0;

        querySnapshot.forEach((doc) => {
          let data = doc.data();

          if (data.ativo === true) ativos++;
          else concluidos++;
        });

        // Atualiza no HTML
        document.getElementById("servicos-ativos").textContent = ativos;
        document.getElementById("servicos-concluidos").textContent = concluidos;
        document.getElementById("servicos-total").textContent = total;
      })
      .catch((error) => {
        console.error("Erro ao carregar serviços do Firestore:", error);
      });
  }

  function atualizarGraficoPercentual(clientes, paneleiros) {
    var total = clientes + paneleiros;
    var ctx = document.getElementById("cadastroPercentChart").getContext("2d");

    if (donutChart) donutChart.destroy();

    donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Clientes', 'Paneleiros'],
        datasets: [{
          data: [clientes, paneleiros],
          backgroundColor: ['#39cf7d', '#34b1e2'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: {
            display: true,
            formatter: function(value) {
              return Math.round((value / total) * 100) + '%';
            },
            color: '#fff'
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // Início
  window.onload = function() {
    atualizarContadores();  // Realtime
    atualizarServicos();    // Firestore
  };

})();
