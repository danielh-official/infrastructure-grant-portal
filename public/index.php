<?php
declare(strict_types=1);

require __DIR__ . '/../src/Applications.php';
require __DIR__ . '/../src/ApplicationInput.php';

function escape(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_THROW_ON_ERROR);
    exit;
}

function applications(): Applications
{
    $directory = __DIR__ . '/../var';
    $path = getenv('PORTAL_DB') ?: $directory . '/portal.sqlite';
    if (!is_dir(dirname($path)) && !mkdir(dirname($path), 0775, true) && !is_dir(dirname($path))) {
        throw new RuntimeException('Unable to create the database directory.');
    }

    return new Applications($path);
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
header('Cache-Control: no-store');

if ($path === '/api/applications') {
    if ($method === 'GET') {
        jsonResponse(['applicationCount' => applications()->count()]);
    }
    if ($method !== 'POST') {
        header('Allow: GET, POST');
        jsonResponse(['message' => 'Method not allowed.'], 405);
    }
    $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($contentType !== 'application/json') {
        jsonResponse(['message' => 'Send an application/json request.'], 415);
    }
    try {
        $data = json_decode(file_get_contents('php://input'), false, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        jsonResponse(['message' => 'Send a valid JSON object.'], 400);
    }
    if (!$data instanceof stdClass) {
        jsonResponse(['message' => 'Send a valid JSON object.'], 400);
    }
    $input = new ApplicationInput((array) $data);
    if ($input->errors) {
        jsonResponse(['errors' => $input->errors], 422);
    }
    jsonResponse(['reference' => applications()->create($input->values)], 201);
}

if ($path !== '/' && $path !== '/apply') {
    http_response_code(404);
    exit('Page not found.');
}

if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    http_response_code(405);
    exit('Method not allowed.');
}

session_start();
$reference = $_SESSION['reference'] ?? null;
unset($_SESSION['reference']);
$input = new ApplicationInput($_POST);
$errors = [];

if ($method === 'POST') {
    $errors = $input->errors;
    if (!$errors) {
        $_SESSION['reference'] = applications()->create($input->values);
        header('Location: /apply', true, 303);
        exit;
    }
    http_response_code(422);
}

require __DIR__ . '/../views/application.php';
