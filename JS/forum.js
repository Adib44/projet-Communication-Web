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
    const topicElement = document.createElement('div');
    topicElement.className = "topic-card"; 

    const contentSnippet = topic.content ? topic.content.substring(0, 80) + "..." : "";

    topicElement.innerHTML = `
        <div class="topic-main">
          <a href="#" class="topic-title-link" onclick="showTopicDetail(${topic.id})">${topic.title}</a>
          <div class="topic-snippet">${contentSnippet}</div>
          <div class="topic-meta">
            <span class="topic-author">par <strong>${topic.userLogin || 'Anonyme'}</strong></span>
            <span class="topic-sep">·</span>
            <span class="topic-date">${topic.created_at}</span>
          </div>
        </div>
        
        <div class="topic-right">
            <div class="stat">
                <span class="stat-num">${topic.nb_replies}</span>
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
    const topicsPanel = document.getElementById('topics-panel');
    const detailPanel = document.getElementById('detail-panel');
    const contentArea = document.getElementById('topic-content-area');

    const data = await requestTopic(id); 

    if (data) {
        const topicInfo = data.topic ? data.topic : data;
        const reponses = data.reponses ? data.reponses : [];

        topicsPanel.style.display = 'none';
        detailPanel.style.display = 'block';

        let repliesHTML = "";
        if (reponses.length > 0) {
            repliesHTML = reponses.map(r => `
                <div class="reply-card">
                    <div class="reply-meta">Par <strong>${r.userLogin}</strong> le ${r.created_at}</div>
                    <div class="reply-text">${r.content || r.message}</div>
                </div>
            `).join('');
        } else {
            repliesHTML = "<p class='no-replies'>Aucune réponse pour le moment.</p>";
        }

        contentArea.innerHTML = `
            <div class="detail-header">
                <h1 class="detail-title">${topicInfo.title || 'Sans titre'}</h1>
                <div class="topic-meta">par <strong>${topicInfo.userLogin || 'Anonyme'}</strong> · ${topicInfo.created_at || ''}</div>
            </div>
            <div class="detail-body">${topicInfo.content || 'Pas de contenu.'}
            </div>
            <div class="detail-replies">
                <h3>Discussion</h3>
                <div id="replies-list">
                    ${repliesHTML}
                </div>
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