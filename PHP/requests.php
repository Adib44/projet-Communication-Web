<?php

header('Content-Type: application/json');

function dbRequestTopics($db) {
    $query = $db->query('SELECT * FROM topics ORDER BY created_at DESC');
    $query->execute();
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