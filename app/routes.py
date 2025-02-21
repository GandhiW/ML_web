from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory, current_app, jsonify
from werkzeug.utils import secure_filename
import uuid
import os
import base64
from PIL import Image
import numpy as np
from io import BytesIO
from .model_predicting import predict_model  # Import the prediction function from a separate file
from .disease_query import load_disease_data, get_disease_info, get_multiple_disease_info  # Import disease querying

main = Blueprint('main', __name__)

data_path = os.path.join(os.path.dirname(__file__), 'database_penyakit_mulut.csv')

disease_df = load_disease_data(data_path)  # Path to your csv file

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
        file = request.files.get('image')
        
        if file:
             # Secure and save the file with a random unique ID in its name
            filename = secure_filename(file.filename)
            # Generate a random ID and append it to the filename to ensure uniqueness
            unique_filename = str(uuid.uuid4()) + "_" + filename
            file.save(os.path.join('app/static/images/inputs', unique_filename))
            print('file uploaded')

            # Call the separate function to handle model prediction
            disease_names, prediction_image_path = predict_model(unique_filename)

            if disease_names:
                # Get disease information for each predicted disease name
                disease_info_list = get_multiple_disease_info(disease_names, disease_df)

                if disease_info_list:
                    print('Got the disease information')
                    prediction_image_path = prediction_image_path.replace('\\', '/')
                    return render_template('upload.html', disease_info_list=disease_info_list, image_path=prediction_image_path)
                else:
                    flash(f'No disease information found.', 'danger')
                    return render_template('upload.html')
            else:
                flash(f'No disease detected.', 'warning')
                return render_template('upload.html')
        else:
            flash('Tidak ada file yang diunggah.', 'warning')
            return render_template('upload.html')
            
    return render_template('upload.html')

# Route for Webcam Page (webcam.html)
@main.route('/webcam')
def webcam():
    return render_template('webcam.html')

# Route for Webcam Prediction (predict)
@main.route('/predict', methods=['POST'])
def predict():
    # Get the base64 image from the request
    data = request.get_json()
    image_data = data.get('image')  # Base64 image

    # Decode and process the image
    image_data = image_data.split(',')[1]  # Remove base64 prefix
    image = base64.b64decode(image_data)  # Decode base64 image
    image = Image.open(BytesIO(image))  # Convert to PIL Image
    image = np.array(image)  # Convert to numpy array

    # Save the image temporarily on the server
    filename = "captured_image.png"  # Set an arbitrary filename (could be dynamic if you want)
    image_save_path = os.path.join('app/static/images/inputs', filename)
    Image.fromarray(image).save(image_save_path)

    # Get prediction result from the predict_model function
    class_predictions, prediction_image_path = predict_model(filename)

    if class_predictions:
        # Query disease information for each predicted disease
        disease_info_list = get_multiple_disease_info(class_predictions, disease_df)

        if disease_info_list:
            return jsonify({
                'disease_info': disease_info_list,  # Directly return it as it's already a dictionary
                'image_path': url_for('static', filename=prediction_image_path.replace('\\', '/'))
            })
        else:
            return jsonify({'error': 'No disease information found'})
    else:
        return jsonify({'error': 'No disease detected'})
