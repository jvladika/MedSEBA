import pandas as pd
from datetime import datetime
from typing import Optional, List, Dict, Any
from Document import Document

def import_document_to_weaviate(doc: Document) -> None:
    # Convert the Document object into a dictionary format that can be accepted by Weaviate
    documentData: Dict[str, Any]  = {
        "identifier": doc.identifier,
        "externalIdentifier": doc.externalIdentifier,
        "title": doc.title,
        "abstract": doc.abstract,
        "publicationDate": doc.publicationDate.isoformat() if doc.publicationDate else None,
        "citedBy": doc.citedBy,
        "references": doc.references,
        "source": doc.source
    }

    # Use Weaviate client to import data
    try:
        client.data_object.create(
            dataObject=documentData ,
            className="Document"  
        )
        print(f"Document {doc.identifier} imported successfully.")
    except Exception as e:
        print(f"Failed to import document {doc.identifier}: {e}")

chunkSize: int = 1000  
filePath: str = 'pubmed_landscape_data.csv'  
maxChunks: int = 5  


with pd.read_csv(filePath , chunksize=chunkSize ) as reader:
    chunksProcessed: int = 0
    for chunk in reader:
        for index, row in chunk.iterrows(): 
            yearStr: Optional[str] = None
            publicationDate: Optional[datetime] = None
            
            if pd.notnull(row['Year']):
                yearStr  = str(int(row['Year']))
                publicationDate = datetime.strptime(yearStr , '%Y')
            

            doc: Document = Document(
                identifier=str(row['PMID']),
                externalIdentifier=str(row['PMID']),
                title=row['Title'],
                abstract="",  
                publicationDate=publicationDate,
                citedBy=[],  
                references=[], 
                source='MedLine'
            )

            import_document_to_weaviate(doc)

            if index % 1000 == 0:
                print(f"Processed {index} rows in current chunk.")

        chunksProcessed  += 1
        if chunksProcessed  >= maxChunks :
            break  

        print(f"Finished processing chunk {chunksProcessed }.")