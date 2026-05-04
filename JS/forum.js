async function requestTopic(id = null) {
    // Si id est nul, on demande tous les topics, sinon on demande un topic précis
    const url = id ? `api.php?id=${id}` : 'api.php?action=list';
    
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
        const article = document.createElement('article');
        article.innerHTML = `
            <h3>${topic.title}</h3>
            <button onclick="loadDetail(${topic.id})">Voir les réponses</button>
            <div id="details-${topic.id}" class="details"></div>
        `;
        container.appendChild(article);
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
async function loadReplies(id) {
    const targetSpan = document.getElementById(`replies-${id}`);
    
    // Si c'est déjà ouvert, on referme
    if (targetSpan.innerHTML !== "") {
        targetSpan.innerHTML = "";
        return;
    }

    const detail = await requestTopic(id); // Appel AVEC ID
    // On affiche le contenu du sujet et ses réponses dans le span
    targetSpan.innerHTML = `<p>${detail.contenu}</p><ul>` + 
        detail.reponses.map(r => `<li>${r.message}</li>`).join('') + `</ul>`;
}


// Ajout d'un sujet

async function postTopic(topicData) {
    try {
        const response = await fetch('api.php', {
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

    // 2. Validation simple côté frontend
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