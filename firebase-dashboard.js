(function() {
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

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  var db = firebase.database();

  var firestore = firebase.firestore();

  let donutChart = null;
  let donutChartMobile = null;

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

      const totalCadastrosEl = document.getElementById("total-cadastros");
      const totalClientesEl = document.getElementById("total-clientes");
      const totalPaneleirosEl = document.getElementById("total-paneleiros");
      const lastCadastroEl = document.getElementById("last-cadastro");
      const lastClienteEl = document.getElementById("last-cliente");
      const lastPaneleiroEl = document.getElementById("last-paneleiro");

      const totalCadastrosMobileEl = document.getElementById("total-cadastros-mobile");
      const totalClientesMobileEl = document.getElementById("total-clientes-mobile");
      const totalPaneleirosMobileEl = document.getElementById("total-paneleiros-mobile");
      const lastCadastroMobileEl = document.getElementById("last-cadastro-mobile");
      const lastClienteMobileEl = document.getElementById("last-cliente-mobile");
      const lastPaneleiroMobileEl = document.getElementById("last-paneleiro-mobile");

      if (totalCadastrosEl) totalCadastrosEl.textContent = totalCadastros;
      if (totalClientesEl) totalClientesEl.textContent = totalClientes;
      if (totalPaneleirosEl) totalPaneleirosEl.textContent = totalPaneleiros;
      if (lastCadastroEl) lastCadastroEl.innerHTML = "Último cadastro:<br>" + formatarData(ultimoCadastro?.conta);
      if (lastClienteEl) lastClienteEl.innerHTML = "Último cadastro:<br>" + formatarData(ultimoCliente?.conta);
      if (lastPaneleiroEl) lastPaneleiroEl.innerHTML = "Último cadastro:<br>" + formatarData(ultimoPaneleiro?.conta);

      if (totalCadastrosMobileEl) totalCadastrosMobileEl.textContent = totalCadastros;
      if (totalClientesMobileEl) totalClientesMobileEl.textContent = totalClientes;
      if (totalPaneleirosMobileEl) totalPaneleirosMobileEl.textContent = totalPaneleiros;
      if (lastCadastroMobileEl) lastCadastroMobileEl.innerHTML = "Último cadastro:<br>" + formatarData(ultimoCadastro?.conta);
      if (lastClienteMobileEl) lastClienteMobileEl.innerHTML = "Último cadastro:<br>" + formatarData(ultimoCliente?.conta);
      if (lastPaneleiroMobileEl) lastPaneleiroMobileEl.innerHTML = "Último cadastro:<br>" + formatarData(ultimoPaneleiro?.conta);

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

function atualizarServicos() {
  firestore.collection("solicitacoes_servico").onSnapshot((querySnapshot) => {
    let total = querySnapshot.size;
    let ativos = 0;
    let concluidos = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.ativo === true && data.status !== "concluido") {
        ativos++;
      }

      if (data.status && data.status.toLowerCase() === "concluido") {
        concluidos++;
      }
    });

    const servicosAtivosEl = document.getElementById("servicos-ativos");
    const servicosConcluidosEl = document.getElementById("servicos-concluidos");
    const servicosTotalEl = document.getElementById("servicos-total");
    const servicosAtivosMobileEl = document.getElementById("servicos-ativos-mobile");
    const servicosConcluidosMobileEl = document.getElementById("servicos-concluidos-mobile");
    const servicosTotalMobileEl = document.getElementById("servicos-total-mobile");

    if (servicosAtivosEl) servicosAtivosEl.textContent = ativos;
    if (servicosConcluidosEl) servicosConcluidosEl.textContent = concluidos;
    if (servicosTotalEl) servicosTotalEl.textContent = total;
    if (servicosAtivosMobileEl) servicosAtivosMobileEl.textContent = ativos;
    if (servicosConcluidosMobileEl) servicosConcluidosMobileEl.textContent = concluidos;
    if (servicosTotalMobileEl) servicosTotalMobileEl.textContent = total;
  });
}

  function atualizarGraficoPercentual(clientes, paneleiros) {
    var total = clientes + paneleiros;
    const chartEl = document.getElementById("cadastroPercentChart");
    if (!chartEl) return;
    var ctx = chartEl.getContext("2d");

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

    const chartMobileEl = document.getElementById("cadastroPercentChart-mobile");
    if (chartMobileEl) {
      var ctxMobile = chartMobileEl.getContext("2d");
      if (donutChartMobile) donutChartMobile.destroy();
      donutChartMobile = new Chart(ctxMobile, {
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
  }

  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  const navLinks = document.querySelectorAll('.sidebar-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', closeSidebar);
  });

  window.onload = function() {
    atualizarContadores();
    atualizarServicos();
  };

})();
