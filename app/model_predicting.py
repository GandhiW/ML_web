import os
from ultralytics import YOLO

def predict_model(filename):
    # Implement the model prediction process here
    filename_jpg = filename.rsplit('.', 1)[0] + '.jpg'  # Change extension to .jpg
    
    image_path = os.path.join('app/static/images/inputs', filename)
    
    path_to_model = 'app/models/labelSendiri.pt'
    # Example: let's pretend we are using a model (e.g., TensorFlow, PyTorch) to predict the image
    # model = load_model('path_to_model')  # Load your trained model
    # result = model.predict(image_path)   # Predict with your model
    model_oo = YOLO(path_to_model)
    
    # Define the custom directory inside the 'app' folder to save the results
    save_dir = os.path.join('app', 'static', 'runs', 'detect')

    # Perform inference and save results to the custom directory
    results = model_oo.predict(image_path, save=True, project="app", name="static/runs/detect/predict", conf=0.5)

    print(results)

    class_labels = {
        0: 'Calculus',  # Example class label mappings
        1: 'Caries',
        2: 'Gingivitis',
        3: 'Mouth Ulcer'
    }

    class_predictions = []

     # Loop through the results
    for result in results:
        boxes = result.boxes
        cls = boxes.cls  # Get the predicted class indices (tensor)
        conf = boxes.conf  # Get the confidence score
        
        # Print the class label and confidence for each detected object
        for i in range(len(cls)):
            class_id = int(cls[i].item())  # Convert the tensor to a native integer
            class_name = class_labels.get(class_id, 'Unknown')  # Get the class name from the dictionary
            confidence = conf[i].item()  # Get the confidence score
            if class_name not in class_predictions:
                class_predictions.append(class_name)
            # print(f"Class: {class_name}, Confidence: {confidence}")

    for class_name in class_predictions:
        print(f"Class: {class_name}")

    # Use absolute path from the root of the project
    runs_dir = os.path.join('app', 'static', 'runs', 'detect')

    # Get the list of folders in the runs/detect directory
    all_folders = os.listdir(runs_dir)
    
    # Filter only valid folders (those starting with 'predict' followed by a number)
    valid_folders = [folder for folder in all_folders if folder.startswith('predict') and folder[7:].isdigit()]
    
    if not valid_folders:
        raise ValueError("No valid prediction folders found in the 'runs/detect' directory.")
    
    # Sort the valid folders by the numeric part of the folder name (after 'predict')
    sorted_folders = sorted(valid_folders, key=lambda x: int(x.split('predict')[-1]), reverse=True)
    
    # Get the latest prediction folder
    latest_predict_folder = sorted_folders[0]
    prediction_image_path = os.path.join('runs', 'detect', latest_predict_folder, filename_jpg)
    print(prediction_image_path)
    
    return class_predictions, prediction_image_path