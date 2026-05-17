document.addEventListener("DOMContentLoaded", () => {
    // Connexion au serveur
    const socket = new WebSocket('ws://127.0.0.1:12345');
    
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    // Connexion réussie
    socket.onopen = () => {
        console.log("Connecté au serveur de chat");
    };
    // Réception d'un message du serveur
    socket.onmessage = (event) => {
        displayChatMessage(event.data);
    };
    // Erreur ou Fermeture
    socket.onerror = (error) => console.error("Erreur WebSocket:", error);
    socket.onclose = () => console.log("Déconnecté du serveur de chat.");
    // Touche Entrée
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
                if (message !== "") {
                    socket.send(message);
                    chatInput.value = "";
            }
        }
    });

    // Fonction pour afficher le message avec l'horodatage
    function displayChatMessage(text) {
        const now = new Date();
        // Formatage de l'heure
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
        const messageHTML = `
            <div class="chat-msg">
                <div class="chat-meta">Anonyme • ${timeString}</div>
                <div class="chat-text">${escapeHTML(text)}</div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    // Sécurité anti-faille XSS pour le chat
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, match => {
            const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return chars[match];
        });
    }
});