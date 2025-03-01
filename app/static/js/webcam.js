document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const toggleButton = document.getElementById('camera-toggle');
    const flipButton = document.getElementById('camera-flip');
    const captureButton = document.getElementById('camera-capture');
    const canvas = document.getElementById('canvas');
    let cameraOffImage = document.getElementById('camera-off-image');
    const loadingBarContainer = document.getElementById('loading-container'); // Add loading bar container
    const loadingBar = document.getElementById('loading-bar');

    cameraOffImage.addEventListener('load', () => {
        // Gambar sudah dimuat, sekarang bisa ditampilkan
        cameraOffImage.style.display = 'block'; 
    });

    if (!video || !toggleButton || !flipButton || !captureButton || !canvas) {
        console.error("One or more elements not found!");
        return;
    }

    let isRunning = false;
    let stream = null;
    let isFlipped = false;
    let isFrozen = false;

    flipButton.style.display = 'none'; // Initially hide flip button
    captureButton.style.display = 'none'; // Initially hide capture button
    loadingBarContainer.style.display = 'none'; // Hide loading initially

    function startCamera() {
        navigator.mediaDevices.getUserMedia({ 
            video: {
                aspectRatio: 16/9,
                height: { min: 480 },
            } 
        })
            .then(s => {
                stream = s;
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play();
                    isRunning = true;
                    toggleButton.textContent = 'Turn Off Camera';
                    flipButton.style.display = 'block'; // Show flip button
                    captureButton.style.display = 'block'; // Show capture button
                };
            })
            .catch(error => console.error("Error starting camera:", error));
        cameraOffImage.style.display = 'none'; // Sembunyikan gambar "kamera mati"
        video.style.display = 'block';
    }

    function stopCamera() {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
            isRunning = false;
            toggleButton.textContent = 'Turn On Camera';
            flipButton.style.display = 'none'; // Hide flip button
            captureButton.style.display = 'none'; // Hide capture button
            isFrozen = false;
            canvas.style.display = 'none';
            video.style.display = 'none';
            cameraOffImage.style.display = 'block'; // Tampilkan gambar "kamera mati"
            navigator.mediaDevices.getUserMedia({ video: false })
        }
    }

    toggleButton.addEventListener('click', () => {
        if (isRunning) {
            stopCamera();
        } else {
            startCamera();
        }
    });

    flipButton.addEventListener('click', () => {
        isFlipped = !isFlipped;
        video.style.transform = isFlipped ? 'scaleX(-1)' : 'scaleX(1)';
    });

    captureButton.addEventListener('click', () => {
        isFrozen = !isFrozen;
        if (isFrozen) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (isFlipped) {
                context.scale(-1, 1);
                context.translate(-canvas.width, 0);
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
            // Ganti video dengan canvas:
            video.style.display = 'none';  // Sembunyikan video
            canvas.style.display = 'block'; // Tampilkan canvas
            video.pause();                // Hentikan video

            // Show loading animation
            loadingBarContainer.style.display = 'block';
            loadingBar.style.width = '0%';

            // Animate loading bar
            let progress = 0;
            let interval = setInterval(() => {
                progress += 10;
                loadingBar.style.width = `${progress}%`;

                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 500); // Adjust speed as needed
    
            // Convert the canvas to base64 and send it to the server
            const imageData = canvas.toDataURL('image/png');
            sendImageToServer(imageData, interval); // Function to send image to server
        } else {
            // Unfreeze:
            canvas.style.display = 'none'; // Sembunyikan canvas
            video.style.display = 'block'; // Tampilkan video kembali
            video.play();                 // Lanjutkan video
        }
    });
    
    function sendImageToServer(imageData, interval) {
        fetch('/predict', {
            method: 'POST',
            body: JSON.stringify({ image: imageData }), // Send the image as JSON
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Clear any previous results
            clearInterval(interval); // Stop loading animation when response is received
            loadingBarContainer.style.display = 'none'; // Hide loading bar

            const predictionContainer = document.querySelector('.prediction');
            predictionContainer.innerHTML = ''; // Clear any previous predictions

            let diseaseInfoHtml;
    
            if (data.error_msg) {
                // alert(data.error); // Display error if no disease detected
                diseaseInfoHtml = `<h2 class="error">${data.error_msg}</h2>`
            } else {
                // Render disease information dynamically in the prediction container
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
            
            // // Insert the disease info into the prediction container
            predictionContainer.innerHTML = diseaseInfoHtml;

            if(data.image_path){
                // Display the result image if available
                const resultImageContainer = document.getElementById('result-image-container');
                const resultImage = document.createElement('img');
                resultImage.src = data.image_path; // The path to the image returned by Flask
                resultImage.alt = "Prediction result image";
                resultImageContainer.innerHTML = ''; // Clear any previous image
                resultImageContainer.appendChild(resultImage);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            clearInterval(interval); 
            loadingBarContainer.style.display = 'none';
        });
    }

    // startCamera(); // Optional: Start camera automatically on page load
});