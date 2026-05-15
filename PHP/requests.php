<?php

header('Content-Type: application/json');

function dbRequestTopics($db) {
    $sql = "SELECT t.*, COUNT(r.id) as nb_replies 
            FROM topics t 
            LEFT JOIN replies r ON t.id = r.topicId 
            GROUP BY t.id 
            ORDER BY t.created_at DESC";
            
    $query = $db->query($sql);
    return $query->fetchAll(PDO::FETCH_ASSOC);
}

function dbRequestTopic($db, $id) {
    $query = $db->prepare('SELECT * FROM topics WHERE id = :id');
    $query->execute([':id' => $id]);
    return $query->fetch(PDO::FETCH_ASSOC);
}

function dbRequestReplies($db, $topicId) {
    $query = $db->prepare('SELECT * FROM replies WHERE topicId = :topicId ORDER BY created_at ASC');
    $query->execute([':topicId' => $topicId]);
    return $query->fetchAll(PDO::FETCH_ASSOC);
}