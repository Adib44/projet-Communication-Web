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