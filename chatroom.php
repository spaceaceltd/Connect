<?php
// Simple chatroom message API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$chatroom = isset($_GET['room']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['room']) : null;
if (!$chatroom) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing chatroom number']);
    exit;
}

$chatFile = __DIR__ . "/chatroom_{$chatroom}.json";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['fromName']) || !isset($input['text'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid message']);
        exit;
    }
    $msg = [
        'fromName' => $input['fromName'],
        'text' => $input['text'],
        'timestamp' => time()
    ];
    $messages = file_exists($chatFile) ? json_decode(file_get_contents($chatFile), true) : [];
    $messages[] = $msg;
    file_put_contents($chatFile, json_encode($messages));
    echo json_encode(['status' => 'sent']);
    exit;
}

// GET: return all messages
if (file_exists($chatFile)) {
    $messages = json_decode(file_get_contents($chatFile), true);
    echo json_encode(['messages' => $messages]);
} else {
    echo json_encode(['messages' => []]);
}
