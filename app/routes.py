from flask import Blueprint, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
import os

main = Blueprint('main', __name__)

# Route for Home Page (home.html)
@main.route('/')
def home():
    return render_template('home.html')

# Route for Article Page (artikel.html)
@main.route('/artikel')
def artikel():
    return render_template('article.html')

# Route for Upload Page (upload.html)
@main.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        # Handle file upload
        file = request.files['image']
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join('app/static/images', filename))

            # Perform prediction using the model
            # Example: model_output = predict_model(filename)
            model_output = "Prediction result here"  # Placeholder for actual model output
            
            return render_template('upload.html', prediction=model_output)

    return render_template('upload.html')

# Route for Webcam Page (webcam.html)
@main.route('/webcam')
def webcam():
    return render_template('webcam.html')