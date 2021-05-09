<?php
require 'DBconfig.php';

$conn = new mysqli($hostname, $username, $password, $DBname);
if ($conn->connect_error) exit("Andmebaasi ühendus ebaõnnestus");

$result = $conn->query("SELECT * FROM $countryTableName WHERE id > 0");
if (!$result) exit("Riikide infot ei leitud");

$countriesArray = [];
while ($row = $result->fetch_assoc()) {
  $countriesArray[] = ["name" => $row["name"],
                       "x"    => $row["x"],
                       "y"    => $row["y"]];
}

$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
<script src="phaser.min.js"></script>
<script src="scenes/GameScene.js"></script>
<style>
  body {
    margin: 0;
  }
</style>
</head>
<body>
<script>
let countriesArray = <?php echo json_encode($countriesArray)?>;

let config = {
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
  },
  backgroundColor: 0x0072CE,
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
}

let game = new Phaser.Game(config);
</script>
</body>
</html>