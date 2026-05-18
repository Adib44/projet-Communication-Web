<?php
// Fichier MOCK pour simuler l'authentification
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (strpos($authHeader, 'Basic ') === 0) {
        $base64 = substr($authHeader, 6);
        $credentials = explode(':', base64_decode($base64));
        $username = $credentials[0] ?? '';
        $password = $credentials[1] ?? '';

        // 1. CAS COMPTE ADMINISTRATEUR
        if ($username === 'admin' && $password === '123') {
            echo json_encode([
                'status' => 'success',
                'token' => 'TOKEN_ROLE:admin_USER:admin' // On embarque le rôle et le nom
            ]);
            exit;
        }
        
        // 2. CAS COMPTE UTILISATEUR NORMAL (Exemple avec user1)
        elseif ($username === 'user1' && $password === 'azerty') {
            echo json_encode([
                'status' => 'success',
                'token' => 'TOKEN_ROLE:user_USER:user1' // Rôle user, lié à user1
            ]);
            exit;
        }
    }
    
    http_response_code(401);
    echo json_encode(['error' => 'Identifiants incorrects']);
    exit;
}