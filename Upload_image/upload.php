<?php
$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["gambar"]["name"]);
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

// Validasi file (jenis, ukuran, dll.)
// ...

if ($uploadOk == 0) {
  echo "Maaf, file tidak diunggah.";
} else {
  if (move_uploaded_file($_FILES["gambar"]["tmp_name"], $target_file)) {
    echo "File " . basename($_FILES["gambar"]["name"]) . " telah diunggah.";
    echo "<img src='" . $target_file . "' alt='Gambar yang diunggah'>";
  } else {
    echo "Maaf, terjadi kesalahan saat mengunggah file.";
  }
}
?>