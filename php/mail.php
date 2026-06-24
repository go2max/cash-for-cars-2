<?php
declare(strict_types=1);

header('Content-Type: text/plain; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond(int $status, string $message): void {
    http_response_code($status);
    echo $message;
    exit;
}

function clean_text($value, int $maxLength): string {
    $text = trim((string)$value);
    $text = str_replace(["\0", "\r"], '', $text);
    return substr($text, 0, $maxLength);
}

function rate_limit(string $clientKey, int $limit, int $windowSeconds): void {
    $path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'norcal-cfc-' . hash('sha256', $clientKey) . '.json';
    $handle = @fopen($path, 'c+');
    if ($handle === false) {
        respond(503, 'temporarily_unavailable');
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            respond(503, 'temporarily_unavailable');
        }

        $raw = stream_get_contents($handle);
        $entries = json_decode($raw ?: '[]', true);
        if (!is_array($entries)) $entries = [];

        $now = time();
        $entries = array_values(array_filter($entries, static function ($timestamp) use ($now, $windowSeconds) {
            return is_int($timestamp) && $timestamp > ($now - $windowSeconds);
        }));

        if (count($entries) >= $limit) {
            flock($handle, LOCK_UN);
            fclose($handle);
            respond(429, 'too_many_requests');
        }

        $entries[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($entries));
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        if (is_resource($handle)) fclose($handle);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'invalid_method');
}

$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength <= 0 || $contentLength > 51200) {
    respond(413, 'invalid_request_size');
}

$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
if (strpos($contentType, 'multipart/form-data') !== 0 && strpos($contentType, 'application/x-www-form-urlencoded') !== 0) {
    respond(415, 'invalid_content_type');
}

$fetchSite = strtolower((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
if ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'same-site'], true)) {
    respond(403, 'invalid_origin');
}

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '') {
    $originHost = strtolower((string)parse_url($origin, PHP_URL_HOST));
    $allowedHosts = ['norcalcashforcars.com', 'www.norcalcashforcars.com', 'localhost', '127.0.0.1'];
    if (!in_array($originHost, $allowedHosts, true)) {
        respond(403, 'invalid_origin');
    }
}

$clientIp = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
rate_limit($clientIp, 5, 600);

if (clean_text($_POST['website'] ?? '', 200) !== '') {
    respond(400, 'invalid_submission');
}

$startedAt = (int)($_POST['_started_at'] ?? 0);
$elapsedMs = (int)round(microtime(true) * 1000) - $startedAt;
if ($startedAt <= 0 || $elapsedMs < 1500 || $elapsedMs > 86400000) {
    respond(400, 'invalid_submission');
}

$name = clean_text($_POST['name'] ?? '', 100);
$email = clean_text($_POST['email'] ?? '', 200);
$phone = clean_text($_POST['phone'] ?? '', 30);
$paperwork = clean_text($_POST['paperwork'] ?? '', 20);
$keys = clean_text($_POST['keys'] ?? '', 20);
$zipcode = clean_text($_POST['zipcode'] ?? '', 10);
$vehicleType = clean_text($_POST['vehicle_type'] ?? '', 30);
$notes = clean_text($_POST['notes'] ?? '', 2000);
$source = 'website';

if (strlen($name) < 2 || preg_match('/[\x00-\x1F\x7F]/', $name)) {
    respond(400, 'invalid_name');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) {
    respond(400, 'invalid_email');
}

$phoneDigits = preg_replace('/\D+/', '', $phone);
if (!preg_match('/^[0-9+().\-\s]{7,30}$/', $phone) || strlen($phoneDigits) < 7 || strlen($phoneDigits) > 15) {
    respond(400, 'invalid_phone');
}

if (!preg_match('/^[0-9]{5}(-[0-9]{4})?$/', $zipcode)) {
    respond(400, 'invalid_zipcode');
}

if (!in_array($paperwork, ['yes', 'no', 'not sure'], true)) {
    respond(400, 'invalid_paperwork');
}

if (!in_array($keys, ['yes', 'no', 'not sure'], true)) {
    respond(400, 'invalid_keys');
}

if (!in_array($vehicleType, ['Car', 'Van', 'Truck', 'SUV', 'Motorcycle', 'Other'], true)) {
    respond(400, 'invalid_vehicle_type');
}

$to = 'support@norcalcashforcars.com';
$subject = 'New Vehicle Offer Request - NorCal Cash for Cars';
$message = "New vehicle offer request:\n" .
           "---------------------------------\n" .
           "Name: {$name}\n" .
           "Email: {$email}\n" .
           "Phone: {$phone}\n" .
           "Paperwork: {$paperwork}\n" .
           "Keys: {$keys}\n" .
           "ZIP code: {$zipcode}\n" .
           "Vehicle type: {$vehicleType}\n" .
           "Notes: {$notes}\n" .
           "Source: {$source}\n";

$headers = [
    'From: NorCal Cash for Cars <noreply@norcalcashforcars.com>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8'
];

if (!mail($to, $subject, $message, implode("\r\n", $headers))) {
    respond(500, 'delivery_failed');
}

respond(200, 'success');

