document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector("form");
    const progressBar = document.getElementById("progress-bar");
    const progressBarContainer = document.getElementById("progress-container");
    const fileElem = document.getElementById("fileElem");
    const preview = document.getElementById("preview");
    const msgPos = document.getElementById('prediction-msg');
    const predictionContainer = document.querySelector('.prediction');

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

    form.addEventListener("submit", function(e) {
      e.preventDefault();

      
      let message = "Unggah file Anda";
      let msgHtml;
      
      msgPos.innerHTML = '';
      predictionContainer.innerHTML = ''; // Clear any previous predictions

      // const fileInput = document.getElementById("fileElem")
      const file = fileElem.files[0];

      if(!file){
        message = "Tidak ada file yang diunggah!"
        msgHtml = `<h1>${message}</h1>`
        msgPos.innerHTML = msgHtml;
        return;
      }

      // Show loading animation
      progressBarContainer.style.display = 'block';
      progressBar.style.width = '0%';

      // Animate loading bar
      let progress = 0;
      let interval = setInterval(() => {
          progress += 10;
          progressBar.style.width = `${progress}%`;

          if (progress >= 100) {
              clearInterval(interval);
          }
      }, 500); // Adjust speed as needed

      // Convert image to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);  // Convert file to Base64
      reader.onload = function () {
          const base64String = reader.result; // Extract Base64 without prefix
          sendImage(base64String, interval);
      };

      reader.onerror = function (error) {
          console.error("Error converting image:", error);
          clearInterval(interval);
          progressBarContainer.style.display = 'none';
          msgPos.innerHTML = "<h1>Error dalam membaca file!</h1>";
      };
    });

    function sendImage(base64Image, interval) {
      fetch('/predict', {
          method: 'POST',
          body: JSON.stringify({ image: base64Image }), // Send Base64 data
          headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
          console.log(data);
  
          // Clear any previous results
          clearInterval(interval); // Stop loading animation when response is received
          progressBarContainer.style.display = 'none'; // Hide loading bar
  
          predictionContainer.innerHTML = ''; // Clear any previous predictions
  
          let diseaseInfoHtml;

          if(data.image_path){
            const resultImage = document.createElement('img');
            resultImage.src = data.image_path; // The path to the image returned by Flask
            resultImage.alt = "Prediction result image";
            msgPos.innerHTML = ''; // Clear any previous image
            msgPos.appendChild(resultImage);
            if(data.error_msg){
              diseaseInfoHtml = `<h2 class = "penyakit">${data.error_msg}</h2>`
            } 
            else if (data.disease_info)
            {
              diseaseInfoHtml = data.disease_info.map(disease_info => `
                <h2 class="penyakit">${disease_info['common_name']}</h2>
                <p class="penjelasan-penyakit">${disease_info['description']}</p>
                <br>
                <div class="partition">
                    <div class="p1">
                        <h2 class="penyebab">Penyebab</h2>
                        <ul class="ul">
                            ${disease_info['risk_factors'].map(factor => `<li class="penyebab-penyakit">${factor}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="p2">
                        <h2 class="solusi">Solusi</h2>
                        <ul class="ul">
                            ${disease_info['solutions'].map(solution => `<li class="solus-penyakit">${solution}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join(''); // Join all HTML snippets together
            }
            // Insert the disease info into the prediction container
            predictionContainer.innerHTML = diseaseInfoHtml;
          } 
          else if (data.error_msg)
          {
            msgPos.innerHTML = `<h1>${data.error_msg}</h1>`; // Clear any previous image
          }
      })
      .catch(error => {
          console.error("Error:", error);
          clearInterval(interval);
          progressBarContainer.style.display = 'none';
          msgPos.innerHTML = "<h1>Terjadi kesalahan saat mengunggah!</h1>";
      });
    }
  });