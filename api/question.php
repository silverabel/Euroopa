<?php
if (!$_GET["country"]) exit(sendResponse());

require '../DBconfig.php';

session_start();

global $conn;
$conn = new mysqli($hostname, $username, $password, $DBname);
if ($conn->connect_error) sendResponse(["response" => "andmebaasiühendus ebaõnnestus"]);

mysqli_set_charset($conn, "utf8");

$stmt = $conn->prepare(
  " SELECT $questionTableName.name, a, b, c, correct 
    FROM $questionTableName
    LEFT JOIN $countryTableName ON $questionTableName.country_id = $countryTableName.id
    WHERE $countryTableName.name = ?
    LIMIT ?, 1
  "
);

if (rand(0, 1) === 0) {
  $offset = rand(0, 1);
  $stmt->bind_param("si", $_GET["country"], $offset);
}
else {
  $param = "europe";
  $offset = rand(0, 49);
  $stmt->bind_param("si", $param, $offset);
}


$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) sendResponse();

$questions = $result->fetch_all(MYSQLI_ASSOC);
shuffle($questions);
$question = $questions[0];

$array = [
  "name"    => $question["name"],
  "a"       => $question["a"],
  "b"       => $question["b"],
  "c"       => $question["c"],
  "correct" => $question["correct"],
];

sendResponse($array);




function sendResponse($array = ["response" => "riiki ei leitud"]) {
  global $conn;
  if ($conn) $conn->close();

  $response = json_encode($array);
  $response ? exit($response) : exit(json_encode(["response" => "midagi läks valesti"]));
}