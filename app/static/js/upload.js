document.addEventListener('DOMContentLoaded', function() {
    const fileElem = document.getElementById("fileElem");
    const preview = document.getElementById("preview");

    fileElem.addEventListener("change", function(e) {
      const file = e.target.files[0];

      console.log("File yang dipilih:", file);

      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onloadend = function() {
          preview.src = reader.result;
          console.log("URL data gambar:", reader.result);
        }

        reader.readAsDataURL(file);
      } else {
        preview.src = "#";
        console.log("File bukan gambar atau tidak valid.");
      }
    });
  });

// // navbar
// fetch("../navbar.html") // Pastikan path menuju navbar benar
//   .then(response => {
//       if (!response.ok) {
//           throw new Error("Failed to load navbar");
//       }
//       return response.text();
//   })
//   .then(data => {
//       document.getElementById("navbar").innerHTML = data;
//   })
//   .catch(error => console.error("Error loading navbar:", error));