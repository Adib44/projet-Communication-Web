document.addEventListener("DOMContentLoaded", () => {
    // Connexion au serveur (localhost pour tes tests)
    const socket = new WebSocket('ws://127.0.0.1:12345');
    
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    // 1. Événement : Connexion réussie
    socket.onopen = () => {
        console.log("⚡ Connecté au serveur de chat !");
    };

    // 2. Événement : Réception d'un message du serveur
    socket.onmessage = (event) => {
        // On suppose que le serveur renvoie directement le texte brut ou du JSON
        // Si ton serveur CIRChatServer renvoie du JSON, il faudra faire JSON.parse(event.data)
        displayChatMessage(event.data);
    };

    // 3. Événement : Erreur ou Fermeture
    socket.onerror = (error) => console.error("Erreur WebSocket:", error);
    socket.onclose = () => console.log("🔌 Déconnecté du serveur de chat.");

    // 4. Équouteur sur l'input : Touche Entrée
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            
            if (message !== "") {
                // Envoi du message au serveur WebSocket
                socket.send(message);
                
                // On vide le champ de saisie
                chatInput.value = "";
            }
        }
    });

    // Fonction pour afficher le message avec l'horodatage
    function displayChatMessage(text) {
        const now = new Date();
        // Formatage de l'heure (Ex: 14:32:05)
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const messageHTML = `
            <div class="chat-msg">
                <div class="chat-meta">Anonyme • ${timeString}</div>
                <div class="chat-text">${escapeHTML(text)}</div>
            </div>
        `;

        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        
        // Auto-scroll vers le bas pour voir le dernier message
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