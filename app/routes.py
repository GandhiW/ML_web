from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory, current_app
from werkzeug.utils import secure_filename
import os
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
            # Check if the file is empty or not (Tidak dipakai)
            # if file.filename == '':
            #     flash('Please upload an image file.', 'warning')
            #     return render_template('upload.html')
            
            # Secure and save the file
            filename = secure_filename(file.filename)
            file.save(os.path.join('app/static/images/inputs', filename))
            print('file uploaded')

            # Call the separate function to handle model prediction
            disease_names, prediction_image_path = predict_model(filename)

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

# Route to serve images from the 'runs/detect' directory
@main.route('/runs/detect/<path:filename>')
def serve_prediction_image(filename):
    # Get the absolute path to the root of the project (two levels up from the app folder)
    root_path = os.path.abspath(os.path.join(current_app.root_path, '..', '..'))

    # Define the path to the 'runs/detect' folder using the root path
    runs_dir = os.path.join(root_path, 'runs', 'detect')

    print(f"Serving file from: {os.path.join(runs_dir, filename)}")

    # Use send_from_directory to serve the image
    return send_from_directory(runs_dir, filename)