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

  let usersData = {};
  let evaluationsData = {};
  let ordersData = [];

  function loadUsers() {
    db.ref("users").once("value").then(function(snapshot) {
      usersData = snapshot.val() || {};
      loadEvaluations();
    });
  }

  function loadEvaluations() {
    db.ref("usuarios").once("value").then(function(snapshot) {
      evaluationsData = snapshot.val() || {};
      loadOrders();
    });
  }

  function loadOrders() {
    firestore.collection("solicitacoes_servico").get().then((querySnapshot) => {
      ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      renderUsers();
    });
  }

  function renderUsers() {
    const container = document.getElementById("users-container");
    container.innerHTML = "";

    Object.keys(usersData).forEach(userId => {
      const user = usersData[userId];
      const evalData = evaluationsData[userId] || {};
      const userOrders = ordersData.filter(order => order.clienteId === userId || order.paneleiroId === userId);

      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
        <img src="${user.fotoUrl || './imgs/user.png'}" alt="Foto" class="user-photo">
        <h3>${user.nome}</h3>
        <p>Email: ${user.email || 'N/A'}</p>
        <p>Tipo: ${user.tipoUsuario || 'N/A'}</p>
        <p>Avaliação: ${evalData.mediaAvaliacoes || 0} (${evalData.totalAvaliacoes || 0} avaliações)</p>
        <div class="card-actions">
          <button onclick="viewEvaluations('${userId}')">Ver Avaliações</button>
          <button onclick="viewOrders('${userId}')">Ver Pedidos</button>
          <button onclick="editUser('${userId}')">Editar</button>
          <button onclick="deleteUser('${userId}')">Excluir</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  window.viewEvaluations = function(userId) {
    const evalData = evaluationsData[userId] || {};
    showModal(`Avaliações de ${usersData[userId].nome}`, `
      <p>Média: ${evalData.mediaAvaliacoes || 0}</p>
      <p>Total: ${evalData.totalAvaliacoes || 0}</p>
    `);
  };

  window.viewOrders = function(userId) {
    const userOrders = ordersData.filter(order => order.clienteId === userId || order.paneleiroId === userId);
    let ordersHtml = "<ul>";
    userOrders.forEach(order => {
      ordersHtml += `<li>Status: ${order.status}, Valor: ${order.valorEstimado}, Data: ${order.dataCriacao}</li>`;
    });
    ordersHtml += "</ul>";
    showModal(`Pedidos de ${usersData[userId].nome}`, ordersHtml);
  };

  window.editUser = function(userId) {
    const user = usersData[userId];
    const formHtml = `
      <form id="edit-form">
        <label>Nome: <input type="text" value="${user.nome}" name="nome"></label><br>
        <label>Email: <input type="email" value="${user.email || ''}" name="email"></label><br>
        <label>Tipo: <input type="text" value="${user.tipoUsuario || ''}" name="tipoUsuario"></label><br>
        <button type="submit">Salvar</button>
      </form>
    `;
    showModal(`Editar ${user.nome}`, formHtml);
    document.getElementById("edit-form").addEventListener("submit", function(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updatedUser = {
        ...user,
        nome: formData.get("nome"),
        email: formData.get("email"),
        tipoUsuario: formData.get("tipoUsuario")
      };
      db.ref("users/" + userId).set(updatedUser).then(() => {
        alert("Usuário atualizado!");
        closeModal();
        loadUsers();
      });
    });
  };

  window.deleteUser = function(userId) {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      db.ref("users/" + userId).remove().then(() => {
        alert("Usuário excluído!");
        loadUsers();
      });
    }
  };

  function showModal(title, body) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = body;
    document.getElementById("user-modal").style.display = "block";
  }

  function closeModal() {
    document.getElementById("user-modal").style.display = "none";
  }

  document.querySelector(".close").addEventListener("click", closeModal);

  // Hamburger menu toggle
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }

  window.onload = function() {
    loadUsers();
  };

})();
