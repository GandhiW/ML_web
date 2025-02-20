import pandas as pd

class DiseaseInfo:
    def __init__(self, disease_name, common_name, description, risk_factors, solutions):
        self.disease_name = disease_name
        self.common_name = common_name
        self.description = description
        self.risk_factors = risk_factors
        self.solutions = solutions
    
    def to_dict(self):
        return {
            "disease_name": self.disease_name,
            "common_name": self.common_name,
            "description": self.description,
            "risk_factors": self.risk_factors,
            "solutions": self.solutions
        }

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

def get_multiple_disease_info(disease_names, disease_df):
    disease_info_list = []
    
    for disease_name in disease_names:
        commonName, description, risk_factors, solutions = get_disease_info(disease_name, disease_df)
        
        if description and risk_factors and solutions:
            # Store each disease information in an instance of DiseaseInfo
            disease_info = DiseaseInfo(disease_name, commonName, description, risk_factors, solutions)
            disease_info_list.append(disease_info.to_dict())
    
    return disease_info_list