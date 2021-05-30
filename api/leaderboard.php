<?php
require '../DBconfig.php';

global $conn;
$conn = new mysqli($hostname, $username, $password, $DBname);
if ($conn->connect_error) sendResponse(["response" => "andmebaasiühendus ebaõnnestus"]);

mysqli_set_charset($conn, "utf8");

$postData = json_decode(file_get_contents('php://input'));

if ($postData && $postData->name !== null && $postData->score !== null && $postData->time !== null) {
  $stmt = $conn->prepare(
   "INSERT INTO $leaderboardTableName (name, score, time)
    VALUES (?, ?, ?)
   "
  );

  $stmt->bind_param("sii", $postData->name, $postData->score, $postData->time);
  $stmt->execute();
}

$stmt = $conn->prepare(
 "SELECT name, score, time
  FROM $leaderboardTableName
  ORDER BY score DESC, time
  LIMIT 10
 "
);

$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) sendResponse();

$leaderboard = $result->fetch_all(MYSQLI_ASSOC);

sendResponse($leaderboard);

function sendResponse($array = ["response" => "edetabelit ei leitud"]) {
  global $conn;
  if ($conn) $conn->close();

  $response = json_encode($array);
  $response ? exit($response) : exit(json_encode(["response" => "midagi läks valesti"]));
}