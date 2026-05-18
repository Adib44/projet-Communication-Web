<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/constants.php'; 
require_once __DIR__ . '/requests.php';

$method = $_SERVER['REQUEST_METHOD'];

// --- FONCTION DE VÉRIFICATION DU TOKEN (MOCK) ---
function checkAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    // On attend un format "Bearer TOKEN_ROLE:xxx_USER:yyy"
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        
        // Extraction basique du rôle et du nom d'utilisateur depuis notre faux token
        if (preg_match('/TOKEN_ROLE:(.+)_USER:(.+)/', $token, $matches)) {
            return [
                'role' => $matches[1], // 'admin' ou 'user'
                'username' => $matches[2] // 'admin', 'user1', etc.
            ];
        }
    }
    
    // Si pas de token ou token invalide
    http_response_code(401);
    echo json_encode(['error' => 'Accès refusé. Token manquant ou invalide.']);
    exit;
}
// ------------------------------------------------

try {
    // RÉCUPÉRATION (GET) -> Public (pas besoin de token pour lire)
    if ($method === 'GET') {
        if (isset($_GET['topicId'])) {
            $id = intval($_GET['topicId']);
            $topic = dbRequestTopic($pdo, $id);
            if (!$topic) {
                http_response_code(404);
                echo json_encode(['error' => 'Sujet introuvable']);
                exit;
            }
            $replies = dbRequestReplies($pdo, $id);
            
            echo json_encode([
                'id' => $topic['id'],
                'title' => $topic['title'],
                'content' => $topic['content'],
                'category' => $topic['category'] ?? 'Général',
                'userLogin' => $topic['userLogin'] ?? 'Anonyme',
                'created_at' => $topic['created_at'],
                'replies' => $replies
            ]);
        } else {
            $topics = dbRequestTopics($pdo);
            echo json_encode($topics);
        }
    }

    // CRÉATION (POST) -> Nécessite d'être connecté
    elseif ($method === 'POST') {
        $currentUser = checkAuth(); // Renvoie ['role' => '...', 'username' => '...']
        
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (isset($data['action']) && $data['action'] === 'add_reply') {
            // Ajout d'une réponse (l'auteur devient l'utilisateur connecté)
            $stmt = $pdo->prepare("INSERT INTO replies (topicId, content, userLogin, created_at) VALUES (?, ?, ?, DATETIME('now'))");
            $stmt->execute([$data['topicId'], $data['content'], $currentUser['username']]); 
            echo json_encode(['status' => 'success', 'type' => 'reply']);
        } else {
            // Ajout d'un nouveau sujet (l'auteur est automatiquement l'utilisateur connecté)
            $stmt = $pdo->prepare("INSERT INTO topics (title, content, category, userLogin, created_at) VALUES (?, ?, ?, ?, DATETIME('now'))");
            $stmt->execute([$data['title'], $data['content'], $data['category'], $currentUser['username']]);
            echo json_encode(['status' => 'success', 'type' => 'topic']);
        }
    }

    // SUPPRESSION (DELETE) -> Admin OU Créateur du topic
    elseif ($method === 'DELETE') {
        $currentUser = checkAuth();

        if (isset($_GET['topicId'])) {
            $topicId = intval($_GET['topicId']);
            
            // Récupération du topic pour vérifier le propriétaire
            $topic = dbRequestTopic($pdo, $topicId);
            if (!$topic) {
                http_response_code(404);
                echo json_encode(['error' => 'Sujet introuvable']);
                exit;
            }

            // Sécurité : Si pas admin ET pas le propriétaire -> Refus
            if ($currentUser['role'] !== 'admin' && $topic['userLogin'] !== $currentUser['username']) {
                http_response_code(403);
                echo json_encode(['error' => 'Droit insuffisant.']);
                exit;
            }

            // --- CORRECTION ICI ---
            // 1. On supprime d'abord toutes les réponses liées à ce topic
            $stmtReplies = $pdo->prepare("DELETE FROM replies WHERE topicId = ?");
            $stmtReplies->execute([$topicId]);

            // 2. On supprime ensuite le topic lui-même
            $stmt = $pdo->prepare("DELETE FROM topics WHERE id = ?");
            $stmt->execute([$topicId]);
            // ----------------------

            echo json_encode(['status' => 'deleted']);
        }
    }

    // MODIFICATION (PUT) -> Admin OU Créateur du topic
    elseif ($method === 'PUT') {
        $currentUser = checkAuth();

        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!isset($data['id']) || !isset($data['title']) || !isset($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données incomplètes pour la modification.']);
            exit;
        }

        $topicId = intval($data['id']);
        $topic = dbRequestTopic($pdo, $topicId);
        
        if (!$topic) {
            http_response_code(404);
            echo json_encode(['error' => 'Sujet introuvable']);
            exit;
        }

        // Sécurité : Si pas admin ET pas le propriétaire -> Refus
        if ($currentUser['role'] !== 'admin' && $topic['userLogin'] !== $currentUser['username']) {
            http_response_code(403);
            echo json_encode(['error' => 'Droit insuffisant. Vous ne pouvez modifier que vos propres sujets.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE topics SET title = ?, content = ? WHERE id = ?");
        $stmt->execute([
            $data['title'],
            $data['content'],
            $topicId
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Sujet mis à jour avec succès !']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}