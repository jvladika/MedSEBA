import pandas as pd
from datetime import datetime
#from backend.django.backend.models.Document import Document
from backend.django.backend.models.Document import Document
from backend.django.backend.WeaviateWrapper import WeaviateWrapper
import argparse

def read_header(file_path):
    # Read only the header to get column names
    header = pd.read_csv(file_path, nrows=0).columns
    return header

def load_and_store_documents(abstracts_csv_path, metadata_csv_path, batch_size=10, offset_size=0,max_documents=100):
    # Initialize Weaviate class
    wrapper = WeaviateWrapper()

    # Read header for both datasets
    abstracts_header = read_header(abstracts_csv_path)
    metadata_header = read_header(metadata_csv_path)
    # Read data from CSV file in chunks
    chunk_size = batch_size
    uploadCount = 0
    skippedCount = 0

    print(f"Starting document processing...", flush=True)
    with pd.read_csv(abstracts_csv_path, names= abstracts_header, chunksize=chunk_size, skiprows=offset_size+1) as reader_abstracts:
            with pd.read_csv(metadata_csv_path,names= metadata_header, chunksize=chunk_size, skiprows=offset_size+1) as reader_metadata:
                for batch_number, (chunk_abstracts, chunk_metadata) in enumerate(zip(reader_abstracts, reader_metadata), start=1):

                    documents = []

                    # Process each row in the chunk and create Document objects
                    for index, (abstract_row, metadata_row) in enumerate(zip(chunk_abstracts.iterrows(), chunk_metadata.iterrows())):
                        # Extract metadata
                        year_str = str(int(metadata_row[1]['Year'])) if pd.notnull(metadata_row[1]['Year']) else None
                        publication_date = datetime.strptime(year_str, '%Y').isoformat()+"Z" if year_str else None

                        document = Document(
                            identifier="",
                            externalIdentifier=str(metadata_row[1]['PMID']),
                            title=metadata_row[1]['Title'],
                            abstract=abstract_row[1]['AbstractText'], 
                            publicationDate=publication_date,
                            citedBy=[],
                            references=[],
                            source='MedLine',
                            embeddingModel=""
                        )

                        documents.append(document)

                        # Store the batch of documents in Weaviate
                        if (index+1) % batch_size == 0 and index > 0:
                            for doc in documents:
                                try:
                                    wrapper.storeDocument(doc,verbose=False)
                                    uploadCount += 1
                                except ValueError as e: #Document likley aleady exists
                                    skippedCount+=1

                            documents = []
                        
                        print(f"Batch {batch_number}: {int(uploadCount+skippedCount)} documents processed ({skippedCount} already stored).", end='\r', flush=True)
                        
                    if max_documents is not None and uploadCount >= max_documents:
                        break

                    # Update the offset for the next batch
                    offset_size += batch_size

    print(f"---\nDONE\nUploaded {uploadCount} documents. {skippedCount} documents were already stored in the database.")
             
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load and store documents from CSV files to weaviate.")
    parser.add_argument("--server", default='False', help="Use server paths for CSV files")
    parser.add_argument("--max_documents", type=int, default=None, nargs='?', help="Maximum number of documents to process (default: None for no limit)")
    parser.add_argument("--batch_size", type=int, default=10, help="Batch size for processing documents (default: 10)")
    parser.add_argument("--offset", type=int, default=0, help="Initial offset for processing documents (default: 0)")
    args = parser.parse_args()

    if args.server:
        # Server paths
        abstracts_csv_path = "/mnt/mydrive/PubMed/pubmed_landscape_abstracts.csv"
        metadata_csv_path = "/mnt/mydrive/PubMed/pubmed_landscape_data.csv"
    else:
        # Local paths
        abstracts_csv_path = "backend/weaviate/pubmed_landscape_abstracts_1000.csv"
        metadata_csv_path = "backend/weaviate/pubmed_landscape_data_1000.csv"

    # Load and store documents with the specified batch, offset size, and max documents
    load_and_store_documents(abstracts_csv_path, metadata_csv_path, args.batch_size, args.offset, args.max_documents)
