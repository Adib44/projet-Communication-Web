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
    const container = document.getElementById('forum-container');
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
    const errorBox = document.getElementById('error-message');
    errorBox.textContent = `Oups ! ${message}`;
    errorBox.style.display = 'block';
}