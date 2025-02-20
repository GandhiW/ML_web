from flask import Blueprint, render_template, request, redirect, url_for, flash
from werkzeug.utils import secure_filename
import os
from .model_predicting import predict_model  # Import the prediction function from a separate file
from .disease_query import load_disease_data, get_disease_info  # Import disease querying

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
            disease_name = predict_model(filename)

            # Use the disease name to get additional info
            commonName, description, risk_factors, solutions = get_disease_info('Caries', disease_df)

            if description and risk_factors and solutions:
                print('got the disease information')
                return render_template('upload.html', prediction=disease_name, common=commonName, description=description, 
                                       risk_factors=risk_factors, solutions=solutions)
            else:
                flash(f'Gagal Menggunggah', 'danger')
                return render_template('upload.html')
        else:
            flash('Tidak ada file yang diunggah.', 'warning')
            return render_template('upload.html')
            
    return render_template('upload.html')

# Route for Webcam Page (webcam.html)
@main.route('/webcam')
def webcam():
    return render_template('webcam.html')