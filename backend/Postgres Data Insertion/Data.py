import pandas as pd
import psycopg2
from sqlalchemy import create_engine
import numpy as np
from tqdm import tqdm

def clean_boolean(value):
    if pd.isna(value):
        return False
    return str(value).lower() == 'true'

def import_accident_data(csv_path):
    # Database connection parameters
    DB_PARAMS = {
        "host": "localhost",
        "database": "accidents_db",
        "user": "postgres",
        "password": "1234"
    }
    
    print("Starting data import process...")
    
    # Create SQLAlchemy engine
    engine = create_engine(f'postgresql://{DB_PARAMS["user"]}:{DB_PARAMS["password"]}@{DB_PARAMS["host"]}/{DB_PARAMS["database"]}')
    
    # Get total number of rows in CSV
    total_rows = sum(1 for _ in open(csv_path)) - 1  # subtract 1 for header
    print(f"Total rows to import: {total_rows:,}")
    
    # Initialize counter for successful imports
    imported_rows = 0
    
    # Read CSV in chunks to handle large files
    chunk_size = 50000
    chunks = pd.read_csv(csv_path, chunksize=chunk_size)
    
    for chunk in tqdm(chunks, desc="Importing data", unit="chunks"):
        try:
            # Clean up the data
            df = chunk.copy()
            
            # Convert column names to lowercase
            df.columns = df.columns.str.lower()
            
            # Rename columns to match PostgreSQL naming convention
            df = df.rename(columns={
                'distance(mi)': 'distance',
                'temperature(f)': 'temperature',
                'humidity(%)': 'humidity',
                'pressure(in)': 'pressure',
                'visibility(mi)': 'visibility',
                'wind_direction': 'wind_direction',
                'wind_speed(mph)': 'wind_speed',
                'DayOfWeek': 'day_of_week'
            })
            
            # Convert boolean columns
            boolean_columns = ['amenity', 'bump', 'crossing', 'give_way', 
                             'junction', 'no_exit', 'railway', 'roundabout', 
                             'station', 'stop', 'traffic_calming', 
                             'traffic_signal', 'turning_loop']
            
            for col in boolean_columns:
                df[col] = df[col].apply(clean_boolean)
            
            # Convert start_time to datetime
            df['start_time'] = pd.to_datetime(df['start_time'])
            
            # Replace 'nan' strings with None/NULL
            df = df.replace({np.nan: None, 'nan': None})
            
            # Import to PostgreSQL
            df.to_sql('accidents', engine, if_exists='append', index=False, 
                     method='multi', chunksize=10000)
            
            # Update counter
            imported_rows += len(df)
            
        except Exception as e:
            print(f"\nError importing chunk: {str(e)}")
            continue

    print(f"\nImport completed!")
    print(f"Successfully imported {imported_rows:,} rows out of {total_rows:,} total rows")
    
    # Verify final count in database
    try:
        with psycopg2.connect(**DB_PARAMS) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM accidents")
                db_count = cur.fetchone()[0]
                print(f"Total rows in database: {db_count:,}")
    except Exception as e:
        print(f"Error verifying final count: {str(e)}")

if __name__ == "__main__":
    import_accident_data("accidents.csv")