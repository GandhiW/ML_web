// navbar
fetch("../navbar.html") // Pastikan path menuju navbar benar
  .then(response => {
      if (!response.ok) {
          throw new Error("Failed to load navbar");
      }
      return response.text();
  })
  .then(data => {
      document.getElementById("navbar").innerHTML = data;
  })
  .catch(error => console.error("Error loading navbar:", error));



document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const toggleButton = document.getElementById('camera-toggle');
    const flipButton = document.getElementById('camera-flip');
    const captureButton = document.getElementById('camera-capture');
    const canvas = document.getElementById('canvas');
    let cameraOffImage = document.getElementById('camera-off-image');

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
        } else {
            // Unfreeze:
            canvas.style.display = 'none'; // Sembunyikan canvas
            video.style.display = 'block'; // Tampilkan video kembali
            video.style.filter = 'none';   // Reset filter (jika ada)
            video.play();                 // Lanjutkan video
        }
    });

    // startCamera(); // Optional: Start camera automatically on page load
});