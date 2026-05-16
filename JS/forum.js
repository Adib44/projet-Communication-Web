let editingTopicId = null;

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
        const replies = data.replies ? data.replies : [];

        topicsPanel.style.display = 'none';
        detailPanel.style.display = 'block';

        let repliesHTML = "";
        if (replies.length > 0) {
            repliesHTML = replies.map(r => `
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
                <div class="topic-meta">par <strong>${topicInfo.userLogin || 'Anonyme'}</strong>. ${topicInfo.category} · ${topicInfo.created_at || ''}</div>
            </div>
            <div class="detail-body">${topicInfo.content || 'Pas de contenu.'}
            </div>
            <div class="reply-form-container">
                    <h4>Votre réponse</h4>
                    <form id="addReplyForm" onsubmit="submitReply(event, ${data.id})">
                        <textarea id="replyContent" class="form-control topic-textarea" rows="1" placeholder="Ecrivez votre message ici"></textarea>
                        <button type="submit" class="btn-submit-topic">Envoyer la réponse</button>
                    </form>
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
    e.preventDefault(); 
    const topicData = {
        title: topicForm.querySelector('.topic-input').value,
        content: topicForm.querySelector('.topic-textarea').value
    };
    if (!topicData.title || !topicData.content) {
        displayError("Veuillez remplir le titre et le message !");
        return;
    }
    if (editingTopicId) {
        try {
            const response = await fetch('PHP/api.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTopicId,
                    title: topicData.title,
                    content: topicData.content
                })
            });
            if (!response.ok) throw new Error("Impossible de sauvegarder les modifications.");
            editingTopicId = null;
            topicForm.querySelector('.btn-submit-topic').textContent = "Publier";
        } catch (error) {
            displayError(error.message);
            return;
        }
    } else {
        topicData.category = topicForm.querySelector('.topic-select').value;
        if (!topicData.category) {
            displayError("Veuillez choisir une catégorie !");
            return;
        }
        const result = await postTopic(topicData);
        if (!result) return;
    }
    topicForm.reset(); 
    toggleForm();      
    const updatedTopics = await requestTopic();
    displayTopics(updatedTopics);
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
    const data = await requestTopic(id);
    if (!data) return;
    editingTopicId = id;
    const formWrapper = document.getElementById('newTopicForm');
    const submitBtn = formWrapper.querySelector('.btn-submit-topic');
    formWrapper.querySelector('.topic-input').value = data.title;
    formWrapper.querySelector('.topic-textarea').value = data.content;
    submitBtn.textContent = "Enregistrer les modifications";

    if (!formWrapper.classList.contains('open')) {
        toggleForm();
    }
}

async function submitReply(event, topicId) {
    event.preventDefault();
    const contentInput = document.getElementById('replyContent');
    const content = contentInput.value.trim();
    if (!content) return;
    try {
        const response = await fetch('PHP/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add_reply',
                topicId: topicId,
                content: content
            })
        });
        if (!response.ok) throw new Error("Erreur lors de l'envoi de la réponse.");
        const result = await response.json();
        if (result.status === 'success') {
            await showTopicDetail(topicId);
        } else {
            alert("Erreur du serveur : " + (result.error || "Inconnue"));
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Impossible d'envoyer la réponse.");
    }
}