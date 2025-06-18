import numpy as np
from typing import List

vectors = np.load('step189.npy')

# Define a new class for storing vectors without using a built-in vectorizer
vectorClass = {
    "class": "VectorObject",
    "vectorizer": "none",  # Not using built-in vectorizer
    "properties": [ 
        {
            "name": "vectorId",  # Property to store vector identifiers
            "dataType": ["string"]
        },
        {
            "name": "paperId",  # Additional property for storing paper ID
            "dataType": ["string"]
        },
        # Additional properties can be added here if needed
    ],
}

# Create the new class in the Weaviate schema
try:
    client.schema.create_class(vectorClass)
    print("New 'VectorObject' class created.")
except weaviate.UnexpectedStatusCodeException as e:
    print("Error creating 'VectorObject' class:", e)

client.batch.configure(batch_size=100)  

# Function to store vectors with metadata
def store_vectors_with_metadata(vectors: np.ndarray, metadata: List[str], batch_size: int = 100) -> None:
    with client.batch as batch:
        for index, vector in enumerate(vectors[:1000]):  # Modify to process only 30000 vectors
            data_object: Dict[str, str] = {
                "vector_id": f"vector_{index}",  # Vector identifier
                "paper_id": metadata[index]  # Associated paper ID
            }
            batch.add_data_object(
                data_object=data_object,
                class_name="VectorObject",
                vector=vector.tolist()
            )
            print(f"Importing vector: {index + 1}")

# Generate fake paperIds for demonstration purposes
# In a real scenario, replace this with actual paper IDs
paperIds: List[str] = [f'paper_{i}' for i in range(30000)]

# Use the function to store vectors with metadata
store_vectors_with_metadata(vectors, paperIds)