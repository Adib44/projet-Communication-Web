<?php
// 1. Autoriser l'accès (CORS) et définir le format de réponse
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// 2. Inclure les fichiers du backend
// Vérifie bien que les chemins vers tes fichiers sont corrects
require_once 'constants.php';
require_once 'request.php';

// On récupère la méthode de la requête (GET ou POST)
$method = $_SERVER['REQUEST_METHOD'];

try {
    // --- CAS N°1 : RÉCUPÉRATION (GET) ---
    if ($method === 'GET') {
        
        if (isset($_GET['topicId'])) {
            // Détail d'un topic + ses réponses
            $id = intval($_GET['topicId']);
            $topic = dbRequestTopic($pdo, $id);
            
            if (!$topic) {
                http_response_code(404);
                echo json_encode(['error' => 'Topic non trouvé']);
                exit;
            }

            $replies = dbRequestReplies($pdo, $id);
            
            // On renvoie un objet combiné
            echo json_encode([
                'id' => $topic['id'],
                'titre' => $topic['title'], // Adapté à ta base SQL
                'contenu' => $topic['content'] ?? 'Pas de contenu',
                'reponses' => $replies
            ]);
        } else {
            // Liste de tous les topics
            $topics = dbRequestTopics($pdo);
            echo json_encode($topics);
        }
    } 

    // --- CAS N°2 : CRÉATION (POST) ---
    elseif ($method === 'POST') {
        // Lire le contenu JSON envoyé par le JS
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!$data || empty($data['title']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données invalides ou incomplètes']);
            exit;
        }

        // Ici, on insère dans la base SQLite
        $stmt = $pdo->prepare('INSERT INTO topics (title, content, created_at) VALUES (:title, :content, DATETIME("now"))');
        $stmt->execute([
            ':title' => $data['title'],
            ':content' => $data['content']
        ]);

        // On renvoie un message de succès
        echo json_encode([
            'status' => 'success',
            'message' => 'Topic créé avec succès',
            'id' => $pdo->lastInsertId()
        ]);
    }
} catch (Exception $e) {
    // En cas d'erreur PHP/SQL, on renvoie l'erreur en JSON proprement
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}