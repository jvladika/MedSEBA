import pandas as pd

def read_and_save_first_n_rows(input_csv_path, output_csv_path, n=1000):
    # Read the first n rows from the input CSV file
    df = pd.read_csv(input_csv_path, nrows=n)

    # Save the selected rows to another CSV file
    df.to_csv(output_csv_path, index=False)

if __name__ == "__main__":
    # Replace these values with your actual CSV file paths

    abstracts_csv_path = "/Users/yunuscelik/Desktop/pubmed_landscape_abstracts.csv"
    metadata_csv_path = "/Users/yunuscelik/Desktop/pubmed_landscape_data.csv"
        
    output_abstracts_csv_path = "./pubmed_landscape_abstracts_1000.csv"
    output_metadata_csv_path = "./pubmed_landscape_data_1000.csv"

    # Set the number of rows to read
    n_rows_to_read = 1000

    # Read the first n rows and save to another CSV file
    read_and_save_first_n_rows(abstracts_csv_path, output_abstracts_csv_path, n_rows_to_read)
    read_and_save_first_n_rows(metadata_csv_path, output_metadata_csv_path, n_rows_to_read)

