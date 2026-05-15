async function requestTopic(id = null) {
    // Si id est nul, on demande tous les topics, sinon on demande un topic précis:
    const url = id ? `PHP/api.php?topicId=${id}` : 'PHP/api.php';
    
    try {
        const response = await fetch(url);
        // Gestion des erreurs HTTP (ex: 404, 500)
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        
        return await response.json(); // On retourne les données décodées
    } catch (error) {
        displayError(error.message);
    }
}

function displayTopics(topics) {
    const container = document.getElementById('topicsList');
    container.innerHTML = ''; // On vide pour éviter les doublons

    topics.forEach(topic => {
        console.log(topic.id);
    const topicElement = document.createElement('div');
    topicElement.className = "topic-card"; 

    topicElement.innerHTML = `
        <div class="topic-main">
          <a href="#" class="topic-title-link" onclick="showTopicDetail(${topic.id})">${topic.title}</a>
          <div class="topic-meta">
            <span class="topic-author">par <strong>${topic.userLogin || 'Anonyme'}</strong></span>
            <span class="topic-sep">·</span>
            <span class="topic-date">${topic.created_at}</span>
          </div>
        </div>
        
        <div class="topic-right">
            <div class="stat">
                <span class="stat-num">?</span>
                <span class="stat-lbl">réponses</span>
            </div>
        </div>

        <div class="topic-actions">
            <button class="action-trigger" onclick="toggleActionMenu(event)">⋮</button>
            <div class="action-menu">
                <button onclick="editTopic(${topic.id}, event)">Modifier</button>
                <button class="delete-btn" onclick="deleteTopic(${topic.id}, event)">Supprimer</button>
            </div>
        </div>
    </div>`;
        container.appendChild(topicElement);
    });
}

function displayError(message) {
    const errorBox = document.getElementById('error-display');
    errorBox.textContent = `Oups ! ${message}`;
    errorBox.style.display = 'block';
}

window.onload = async () => {
    const data = await requestTopic(); // Appel sans ID pour la liste
    if (data) displayTopics(data);
};

// Fonction déclenchée au clic sur un sujet
async function showTopicDetail(id) {
    console.log("Tentative d'ouverture du sujet n°", id);
    const topicsPanel = document.getElementById('topics-panel');
    const detailPanel = document.getElementById('detail-panel');
    const contentArea = document.getElementById('topic-content-area');

    // 1. On va chercher les données du sujet précis
    const detail = await requestTopic(id); 

    if (detail) {
        // 2. On cache la liste et on affiche le panneau de détail
        topicsPanel.style.display = 'none';
        detailPanel.style.display = 'block';

        // 3. On construit le HTML du contenu + des réponses
        let repliesHTML = "";
        if (detail.reponses && detail.reponses.length > 0) {
            repliesHTML = detail.reponses.map(r => `
                <div class="reply-card">
                    <div class="reply-meta">Par <strong>${r.userLogin}</strong> le ${r.created_at}</div>
                    <div class="reply-text">${r.message || r.content}</div>
                </div>
            `).join('');
        } else {
            repliesHTML = "<p class='no-replies'>Aucune réponse pour le moment.</p>";
        }

        contentArea.innerHTML = `
            <h1 class="detail-title">${detail.title}</h1>
            <div class="detail-main-content">${detail.content}</div>
            <hr>
            <h3>Réponses</h3>
            <div class="replies-container">
                ${repliesHTML}
            </div>
        `;
    }
}

// Fonction pour revenir à la liste
function backToList() {
    document.getElementById('topics-panel').style.display = 'block';
    document.getElementById('detail-panel').style.display = 'none';
}


// Ajout d'un sujet

async function postTopic(topicData) {
    try {
        const response = await fetch('PHP/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // On transforme l'objet JS en texte JSON
            body: JSON.stringify(topicData)
        });
        if (!response.ok) {
            throw new Error(`Erreur lors de la publication (${response.status})`);
        }
        return await response.json();
    } catch (error) {
        displayError(error.message);
        return null;
    }
}

const topicForm = document.querySelector('#newTopicForm form');

topicForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // CRUCIAL : empêche le rechargement de la page

    // Récupération des valeurs via les classes de ton HTML
    const topicData = {
        title: topicForm.querySelector('.topic-input').value,
        category: topicForm.querySelector('.topic-select').value,
        content: topicForm.querySelector('.topic-textarea').value
    };

    // Validation simple côté frontend
    if (!topicData.title || !topicData.category || !topicData.content) {
        displayError("Veuillez remplir tous les champs !");
        return;
    }

    // Envoi au serveur
    const result = await postTopic(topicData);

    // Si l'envoi est réussi
    if (result) {
        topicForm.reset(); // On vide les champs
        toggleForm();      // On ferme le formulaire (ta fonction existante)
        
        // Rafraîchir la liste des topics pour voir le nouveau apparaître
        const updatedTopics = await requestTopic();
        displayTopics(updatedTopics);
    }
});

// Petite fonction pour afficher/cacher le menu
function toggleActionMenu(event) {
    event.stopPropagation();
    const menu = event.target.nextElementSibling;
    // Ferme les autres menus ouverts
    document.querySelectorAll('.action-menu').forEach(m => {
        if(m !== menu) m.classList.remove('show');
    });
    menu.classList.toggle('show');
}

// Fermer le menu si on clique ailleurs
window.onclick = () => {
    document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
};

async function deleteTopic(id, event) {
    event.stopPropagation();
    if (!confirm("Supprimer définitivement ce sujet ?")) return;
    const response = await fetch(`PHP/api.php?topicId=${id}`, { method: 'DELETE' });
    if (response.ok) {
        const updatedData = await requestTopic(); 
        displayTopics(updatedData); 
    } else {
        alert("Erreur lors de la suppression");
    } 
}

async function editTopic(id, event) {
    event.stopPropagation();
    const newTitle = prompt("Entrez le nouveau titre :");
    if (!newTitle) return;

    // Ici on ferait un fetch avec la méthode PUT ou POST
    console.log("Modifier le sujet", id, "avec le titre", newTitle);
    // On pourra implémenter le fetch PUT plus tard si tu veux
}