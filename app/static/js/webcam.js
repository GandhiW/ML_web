document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const toggleButton = document.getElementById('camera-toggle');
    const flipButton = document.getElementById('camera-flip');
    const captureButton = document.getElementById('camera-capture');
    const canvas = document.getElementById('canvas');
    let cameraOffImage = document.getElementById('camera-off-image');
    const loadingBarContainer = document.getElementById('loading-container');
    const loadingBar = document.getElementById('loading-bar');
    const countdownContainer = document.createElement('div'); // Countdown display
    countdownContainer.id = 'countdown-container';
    countdownContainer.style.display = 'none';
    countdownContainer.style.position = 'absolute';
    countdownContainer.style.top = '20%';
    countdownContainer.style.left = '23.5%';
    countdownContainer.style.transform = 'translate(-50%, -50%)';
    countdownContainer.style.fontSize = '100px';
    countdownContainer.style.fontWeight = 'bold';
    countdownContainer.style.color = 'red';
    document.body.appendChild(countdownContainer);

    let isRunning = false;
    let stream = null;
    let isFlipped = false;
    let isFrozen = false;

    flipButton.style.display = 'none';
    captureButton.style.display = 'none';
    loadingBarContainer.style.display = 'none';

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
                    flipButton.style.display = 'block';
                    captureButton.style.display = 'block';
                };
            })
            .catch(error => console.error("Error starting camera:", error));
        cameraOffImage.style.display = 'none';
        video.style.display = 'block';
    }

    function stopCamera() {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
            isRunning = false;
            toggleButton.textContent = 'Turn On Camera';
            flipButton.style.display = 'none';
            captureButton.style.display = 'none';
            isFrozen = false;
            canvas.style.display = 'none';
            video.style.display = 'none';
            cameraOffImage.style.display = 'block';
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
        if (isFrozen) {
            // If already frozen, unfreeze immediately
            unfreezeCamera();
        } else {
            // If active, start countdown before capturing
            startCountdown(3);
        }
    });

    function startCountdown(seconds) {
        let countdown = seconds;
        countdownContainer.innerText = countdown;
        countdownContainer.style.display = 'block';

        let countdownInterval = setInterval(() => {
            countdown--;
            countdownContainer.innerText = countdown;

            if (countdown === 0) {
                clearInterval(countdownInterval);
                countdownContainer.style.display = 'none';
                captureImage();
            }
        }, 1000);
    }

    function captureImage() {
        isFrozen = true;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (isFlipped) {
            context.scale(-1, 1);
            context.translate(-canvas.width, 0);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        video.style.display = 'none';
        canvas.style.display = 'block';
        video.pause();

        const resultImageContainer = document.getElementById('result-image-container');
        resultImageContainer.innerHTML = '';

        loadingBarContainer.style.display = 'block';
        loadingBar.style.width = '0%';

        let progress = 0;
        let interval = setInterval(() => {
            progress += 10;
            loadingBar.style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 500);

        const imageData = canvas.toDataURL('image/png');
        sendImageToServer(imageData, interval);
    }

    function unfreezeCamera() {
        isFrozen = false;
        canvas.style.display = 'none';
        video.style.display = 'block';
        video.play();
    }

    function sendImageToServer(imageData, interval) {
        fetch('/predict', {
            method: 'POST',
            body: JSON.stringify({ image: imageData }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            clearInterval(interval);
            loadingBarContainer.style.display = 'none';

            const predictionContainer = document.querySelector('.prediction');
            predictionContainer.innerHTML = '';

            let diseaseInfoHtml;

            if (data.error_msg) {
                diseaseInfoHtml = `<h2 class="error">${data.error_msg}</h2>`
            } else {
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
                `).join('');
            }
            
            predictionContainer.innerHTML = diseaseInfoHtml;

            if(data.image_path){
                const resultImageContainer = document.getElementById('result-image-container');
                const resultImage = document.createElement('img');
                resultImage.src = data.image_path;
                resultImage.alt = "Prediction result image";
                resultImageContainer.innerHTML = '';
                resultImageContainer.appendChild(resultImage);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            clearInterval(interval);
            loadingBarContainer.style.display = 'none';
        });
    }
});
