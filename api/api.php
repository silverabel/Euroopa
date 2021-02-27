<?php
require 'config.php';

if ($_SERVER["HTTP_REFERER"] !== $allowedAddress || $_GET["countries"] !== "true") sendResponse();

global $conn;
$conn = new mysqli($hostname, $username, $password, $DBname);
if ($conn->connect_error) sendResponse(["response" => "andmebaasiühendus ebaõnnestus"]);

$result = $conn->query("SELECT * FROM country");
if ($result->num_rows === 0) sendResponse(false);

$response = [];
while ($row = $result->fetch_assoc()) {
  $response[] = ["name" => $row["name"],
                 "x"    => $row["x"],
                 "y"    => $row["y"]];
}

sendResponse(["response" => $response]);

$conn->close();




function sendResponse($array = ["response" => "mine pekki"]) {
  global $conn;
  if ($conn) $conn->close();

  $response = json_encode($array);
  $response ? exit($response) : exit(json_encode(["response" => "midagi läks valesti"]));
}