<?php
// On active l'affichage des erreurs pour le débuggage (à enlever en production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Inclusion de tes fichiers de base
require_once __DIR__ . '/constants.php'; 
require_once __DIR__ . '/requests.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // --- 1. RÉCUPÉRATION (GET) ---
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
                'titre' => $topic['title'],
                'contenu' => $topic['content'],
                'userLogin' => $topic['userLogin'] ?? 'Anonyme',
                'reponses' => $replies
            ]);
        } else {
            // Liste de tous les sujets
            $topics = dbRequestTopics($pdo);
            echo json_encode($topics);
        }
    }

    // --- 2. CRÉATION (POST) ---
    elseif ($method === 'POST') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (isset($data['action']) && $data['action'] === 'add_reply') {
            // Ajout d'une réponse
            $stmt = $pdo->prepare("INSERT INTO replies (topicId, content, userLogin, created_at) VALUES (?, ?, ?, DATETIME('now'))");
            $stmt->execute([$data['topicId'], $data['content'], 'Utilisateur']); // 'Utilisateur' par défaut pour le moment
            echo json_encode(['status' => 'success', 'type' => 'reply']);
        } else {
            // Ajout d'un nouveau sujet
            $stmt = $pdo->prepare("INSERT INTO topics (title, content, userLogin, created_at) VALUES (?, ?, ?, DATETIME('now'))");
            $stmt->execute([$data['title'], $data['content'], 'Utilisateur']);
            echo json_encode(['status' => 'success', 'type' => 'topic']);
        }
    }

    // --- 3. SUPPRESSION (DELETE) ---
    elseif ($method === 'DELETE') {
        if (isset($_GET['topicId'])) {
            $stmt = $pdo->prepare("DELETE FROM topics WHERE id = ?");
            $stmt->execute([intval($_GET['topicId'])]);
            echo json_encode(['status' => 'deleted']);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}