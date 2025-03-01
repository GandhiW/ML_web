import os
from ultralytics import YOLO
import cv2

def predict_model(filename, mouth_box):
    filename_jpg = filename.rsplit('.', 1)[0] + '.jpg'  # Change extension to .jpg
    
    image_path = os.path.join('app/static/images/inputs', filename)
    
    path_to_model = 'app/models/Object Detection Model/model-v4.pt'
    model_oo = YOLO(path_to_model)
    
    # Define the custom directory inside the 'app' folder to save the results
    save_dir = os.path.join('app', 'static', 'runs', 'detect')

    # Perform inference and save results to the custom directory
    results = model_oo.predict(image_path, save=True, project="app", name="static/runs/detect/predict", conf=0.5, augment=True)
    # results = model_oo.predict(image_path, conf=0.5)

    print(results)

    class_labels = {
        0: 'Calculus',  # Example class label mappings
        1: 'Caries',
        2: 'Gingivitis',
        3: 'Mouth Ulcer'
    }

    class_predictions = set()

    # Load the image for drawing
    img = cv2.imread(image_path)

    # Extract mouth box coordinates
    x1_m, y1_m, x2_m, y2_m = mouth_box

    # Loop through the detected results
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls.item())  # Get class index
            confidence = box.conf.item()  # Get confidence score
            x1_d, y1_d, x2_d, y2_d = map(int, box.xyxy[0])  # Get bounding box coordinates

            # Check if the disease box is inside the mouth box
            if x1_m <= x1_d and y1_m <= y1_d and x2_d <= x2_m and y2_d <= y2_m:
                class_name = class_labels.get(class_id, 'Unknown')

                # Add unique class name to predictions
                class_predictions.add(class_name)

                # Draw disease bounding box in **blue**
                cv2.rectangle(img, (x1_d, y1_d), (x2_d, y2_d), (255, 0, 0), 2)  

                # Get text size for background box
                text = f"{class_name} ({confidence:.2f})"
                (text_width, text_height), baseline = cv2.getTextSize(text, 
                                                                    cv2.FONT_HERSHEY_SIMPLEX, 
                                                                    0.5, 1)

                # Define background rectangle coordinates
                text_x1 = max(x1_d, 0)  # Ensure text starts within image width
                text_y1 = max(y1_d - text_height - 5, 0)  # Ensure text is not above image
                text_x2 = min(x1_d + text_width, img.shape[1] - 1)  # Ensure text does not exceed width
                text_y2 = min(y1_d, img.shape[0] - 1)  # Ensure text does not exceed height

                # Adjust text position if necessary
                if text_x2 >= img.shape[1]:  
                    text_x1 = max(x1_d - text_width, 0)  # Shift left if text goes beyond right edge
                    text_x2 = x1_d  # Adjust right boundary

                if text_y2 >= img.shape[0]:  
                    text_y1 = max(y1_d - text_height - 5, 0)  # Shift text upwards if it exceeds bottom

                # Draw the filled background rectangle (Contrast color: White)
                cv2.rectangle(img, (text_x1, text_y1), (text_x2, text_y2), (255, 255, 255), cv2.FILLED)

                # Compute text position inside the rectangle
                text_x = text_x1 + 2  # Small padding from left edge
                text_y = text_y2 - 5  # Slightly above bottom to align

                # Draw text over the background in blue
                cv2.putText(img, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 
                            0.5, (255, 0, 0), 1)

    # Convert set to list
    class_predictions = list(class_predictions)

    for class_name in class_predictions:
        print(f"Class: {class_name}")

    # Save the annotated image
    prediction_savePath = os.path.join("app/static/runs/detect/predict", filename_jpg)
    cv2.imwrite(prediction_savePath, img)

    # # Use absolute path from the root of the project
    # runs_dir = os.path.join('app', 'static', 'runs', 'detect')

    # # Get the list of folders in the runs/detect directory
    # all_folders = os.listdir(runs_dir)
    
    # # Filter only valid folders (those starting with 'predict' followed by a number)
    # valid_folders = [folder for folder in all_folders if folder.startswith('predict') and folder[7:].isdigit()]
    
    # if not valid_folders:
    #     raise ValueError("No valid prediction folders found in the 'runs/detect' directory.")
    
    # # Sort the valid folders by the numeric part of the folder name (after 'predict')
    # sorted_folders = sorted(valid_folders, key=lambda x: int(x.split('predict')[-1]), reverse=True)
    
    # # Get the latest prediction folder
    # latest_predict_folder = sorted_folders[0]
    # prediction_image_path = os.path.join('runs', 'detect', latest_predict_folder, filename_jpg)
    returned_savePath = os.path.join("runs/detect/predict", filename_jpg)
    print(returned_savePath)
    
    return class_predictions, returned_savePath


def isMouthArea(filename):
    image_path = os.path.join('app/static/images/inputs', filename)
    
    path_to_model = 'app/models/Classification Model/model-v3.pt'
    model_mouth_cls = YOLO(path_to_model)
    
    # Define the custom directory inside the 'app' folder to save the results
    save_dir = os.path.join('app', 'static', 'runs', 'detect')

    # Perform inference and save results to the custom directory
    results = model_mouth_cls.predict(image_path)
    # print(results)

    for r in results:
        if r is not None:
            prob = r.probs
            idx = prob.top1
            conf = prob.top1conf
            if idx == 0 and conf.item() > 0.8:
                print("Mouth area detected: ", conf.item())
                return True
            
    return False


def calculateMouthArea(filename):
    image_path = os.path.join('app/static/images/inputs', filename)

    # Load the image
    img = cv2.imread(image_path)

    # Get image dimensions
    img_height, img_width, _ = img.shape
    image_area = img_width * img_height  # Total image area
    
    path_to_model = 'app/models/Object Detection Model/Mouth Area/best.pt'
    model_mouth_obd = YOLO(path_to_model)

    result = model_mouth_obd.predict(image_path)

    mouth_detected = "False"
    mouth_box = None  # Store the bounding box coordinates if a mouth is detected

    for r in result:
        boxes = r.boxes
        for box in boxes:
            # Extract bounding box coordinates
            x1, y1, x2, y2 = box.xyxy[0]  # Get coordinates in [x1, y1, x2, y2] format
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)  # Convert to integers

            # Calculate bounding box area
            area = (x2 - x1) * (y2 - y1)
            mouth_fraction = area / image_area

            print(f"Mouth Bounding Box Area: {area} pixels²")
            print(f"Mouth Area Fraction: {mouth_fraction:.2f}")

            if(mouth_fraction < 0.2):
                mouth_detected = "Too Small"
                break

            # If we find at least one bounding box, update detection flag and store coordinates
            mouth_detected = "True"
            mouth_box = (x1, y1, x2, y2)
            break  # Assuming only one mouth is present, break after first detection

    return mouth_detected, mouth_box