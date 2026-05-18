<?php
// On active l'affichage des erreurs pour le débuggage 
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Inclusion de tes fichiers de base
require_once __DIR__ . '/constants.php'; 
require_once __DIR__ . '/requests.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // RÉCUPÉRATION (GET)
    if ($method === 'GET') {
        if (isset($_GET['topicId'])) {
            $id = intval($_GET['topicId']);
            
            // On utilise les fonctions de request.php
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
                'category' => $topic['category'] ?? 'Géneral',
                'userLogin' => $topic['userLogin'] ?? 'Anonyme',
                'created_at' => $topic['created_at'],
                'replies' => $replies
            ]);
        } else {
            // Liste de tous les sujets
            $topics = dbRequestTopics($pdo);
            echo json_encode($topics);
        }
    }

    // CRÉATION (POST)
    elseif ($method === 'POST') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (isset($data['action']) && $data['action'] === 'add_reply') {
            // Ajout d'une réponse
            $stmt = $pdo->prepare("INSERT INTO replies (topicId, content, userLogin, created_at) VALUES (?, ?, ?, DATETIME('now'))");
            $stmt->execute([$data['topicId'], $data['content'], $data['author'] ?? 'Anonyme']); // 'Utilisateur' par défaut pour le moment
            echo json_encode(['status' => 'success', 'type' => 'reply']);
        } else {
            // Ajout d'un nouveau sujet
            $stmt = $pdo->prepare("INSERT INTO topics (title, content, category, userLogin, created_at) VALUES (?, ?, ?, ?, DATETIME('now'))");
            $stmt->execute([$data['title'], $data['content'], $data['category'], $data['author'] ?? 'Anonyme']);
            echo json_encode(['status' => 'success', 'type' => 'topic']);
        }
    }

    // SUPPRESSION (DELETE)
    elseif ($method === 'DELETE') {
        if (isset($_GET['topicId'])) {
            $stmt = $pdo->prepare("DELETE FROM topics WHERE id = ?");
            $stmt->execute([intval($_GET['topicId'])]);
            echo json_encode(['status' => 'deleted']);
        }
    }

    // MODIFICATION (PUT) 
    elseif ($method === 'PUT') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        // Vérification de sécurité sur les données reçues
        if (!isset($data['id']) || !isset($data['title']) || !isset($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données incomplètes pour la modification.']);
            exit;
        }

        // Requête SQL de mise à jour (UPDATE)
        $stmt = $pdo->prepare("UPDATE topics SET title = ?, content = ? WHERE id = ?");
        $stmt->execute([
            $data['title'],
            $data['content'],
            intval($data['id'])
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Sujet mis à jour avec succès !']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}