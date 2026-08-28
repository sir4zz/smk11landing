<?php
// Reads guru-akun-login.xlsx and returns array of account data
require_once __DIR__.'/../vendor/autoload.php';

$reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile('C:/Users/OWNER/Documents/smkn11-website/guru-akun-login.xlsx');
$spreadsheet = $reader->load('C:/Users/OWNER/Documents/smkn11-website/guru-akun-login.xlsx');
$sheet = $spreadsheet->getActiveSheet();
$rows = $sheet->toArray(null, true, true, true);

$headers = null;
$data = [];
foreach ($rows as $i => $row) {
    if ($i === 0) {
        $headers = $row;
        continue;
    }
    // Skip empty rows or template row
    if (empty($row['A']) || $row['A'] === 'No' || $row['B'] === 'NAMA LENGKAP') {
        continue;
    }
    $entry = [];
    foreach ($headers as $col => $header) {
        $entry[trim($header)] = trim((string)($row[$col] ?? ''));
    }
    $data[] = $entry;
}
return $data;
