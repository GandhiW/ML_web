import pandas as pd

def load_disease_data(file_path):
    """
    Load the disease information from the Excel file.
    """
    # Load the Excel file into a pandas DataFrame
    df = pd.read_csv(file_path, sep=';')
    
    # Ensure that column names match your Excel sheet (you can modify this to match your column names)
    return df

def get_disease_info(disease_name, df):
    """
    Get the disease description, risk factors, and solutions for the given disease name.
    """
    # Query the DataFrame for the disease name
    disease_data = df[df['penyakit'].str.lower() == disease_name.lower()]
    
    if not disease_data.empty:
        # If the disease is found, extract the relevant information
        description = disease_data['deskripsi'].values[0]
        commonName = disease_data['nama lain'].values[0]
        
        # Convert the risk factors and solutions to lists
        risk_factors = [item.strip() for item in disease_data['penyebab'].values[0].split(',')]
        solutions = [item.strip() for item in disease_data['solusi'].values[0].split(',')]
        
        return commonName, description, risk_factors, solutions
    else:
        # If no disease is found, return None or a message
        return None, None, None
