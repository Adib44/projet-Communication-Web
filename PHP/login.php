<?php
// Fichier MOCK pour tester AUOTH2 - génère un token si id = admin et mdp = 123
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (strpos($authHeader, 'Basic ') === 0) {
        $base64 = substr($authHeader, 6);
        $credentials = explode(':', base64_decode($base64));
        $username = $credentials[0] ?? '';
        $password = $credentials[1] ?? '';

        if ($username === 'admin' && $password === '123') {
            echo json_encode([
                'status' => 'success',
                'token' => 'FAUX_TOKEN_DE_TEST_123456789'
            ]);
            exit;
        }
    }
    
    http_response_code(401);
    echo json_encode(['error' => 'Identifiants incorrects']);
    exit;
}
