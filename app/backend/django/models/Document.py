from datetime import datetime
from typing import List, Optional, Tuple, Dict
import json
import re
from .EmbeddingModels import default_embeddingModel_instance
from .EntailmentModels import default_entailmentModel_instance, AbstractEntailmentModel

class Document:
    """
    This Document class is designed to encapsulate, manage, and act on the information and metadata of a document (e.g., a research paper) retrieved from a vector-based search engine like Weaviate.
    """

    class QuerySpecificData:
        """
        This class obtains and stores all data of a document, which is specific to a given query.
        """
        def __init__(
            self,
            document: 'Document',
            query: str
        ):
            self.query = query
            self.relevantSection = Document.QuerySpecificData.RelevantSection(query, document.abstract)
            self.agreeableness = Document.QuerySpecificData.Agreeableness(query, self.relevantSection)

        class RelevantSection:
            """
            Class to obtain and store the most relevant section of a document, w.r.t a given query.
            """
            def __init__(
                self,
                query: str,
                abstract: str
            ):
                # Separate the abstract into sentences
                sentences = re.split(r'(?<=[.!?]) +', abstract)
                # Calculate cosine similarity between each sentence and the query, and retain the best sentence
                maxSimilarity = None
                mostRelevantSentence: str = None
                model = default_embeddingModel_instance
                for sentence in sentences:
                    similarity = model.unitCosineSimilarity(query, sentence, prune=False)
                    if maxSimilarity == None or similarity > maxSimilarity:
                        maxSimilarity = similarity
                        mostRelevantSentence = sentence
                # Assign final values
                self.embeddingModel = model.identifier
                self.mostRelevantSentence=mostRelevantSentence
                self.similarityScore=maxSimilarity

        class Agreeableness:
            """
            Class to obtain and store the agreeableness-data of a document, w.r.t a given query.
            """
            def __init__(
                self, 
                query: str,
                relevantSection: 'Document.QuerySpecificData.RelevantSection'
            ):
                model = default_entailmentModel_instance
                prediction: AbstractEntailmentModel.Prediction = model.predict(
                    sentence_a=relevantSection.mostRelevantSentence,
                    sentence_b=query
                )
                self.entailmentModel = model.identifier
                self.agree: float = prediction.entailment
                self.disagree: float = prediction.contradiction
                self.neutral: Optional[float] = prediction.neutral

    def __init__(
        self, 
        pmid: str,
        title: str, 
        abstract: str, 
        publicationDate: str,
        citations: Dict[str, int] = None,  # Update type hint
        # Remove unused fields
        journal: str = "",
        authors: List[str] = None,
        citationCount: int = 0,
        referenceCount: int = 0,
    ):
        # Required fields
        self.pmid = pmid
        self.title = title
        self.abstract = abstract
        self.publicationDate = publicationDate
        self.citations = citations or {"total": 0}  # Set default structure
        
        # Optional fields
        self.journal = journal
        self.authors = authors or []
        self.citationCount = citationCount
        self.referenceCount = referenceCount
        self.queryRelated: Document.QuerySpecificData = None

        # self.identifier = identifier  # Unique identifier within Weaviate
        # self.pmid = pmid
        # self.externalIdentifier = externalIdentifier  # Identifier used by the dataset
        # self.title = title  # Title of the document
        # self.abstract = abstract  # Abstract of the document
        # self.publicationDate = publicationDate  # Publication date
        # self.citedBy = citedBy  # List of identifiers of documents that cite this document
        # self.references = references  # List of identifiers of documents cited by this document
        # self.source = source  # Source or dataset name/ID
        # self.vector = vector  # Stores the vector representation of the document
        # self.embeddingModel = embeddingModel  # Stores the vector representation of the document
        # self.citationCount = citationCount
        # self.referenceCount = referenceCount
        # self.journal = journal
        # self.semanticScholarPaperId = semanticScholarPaperId
        # self.authors = authors
        # self.queryRelated: Document.QuerySpecificData = None

    def __eq__(self, other) -> bool:
        """Overload the equality operator to compare documents based on identifiers."""
        if not isinstance(other, Document):
            return NotImplemented
        return self.identifier == other.identifier

    def __str__(self) -> str:
        """Provide a string representation of the document."""
        return (f"Document {self.pmid} titled '{self.title}', "
                f"published on {self.publicationDate}, "
                f"from source '{self.source}'.")
    
    def loadDataSpecificTo(self, query: str) -> None:
        self.queryRelated = Document.QuerySpecificData(self, query)

    def add_vector(self, vector: List[float]) -> None:
        """Add or update the vector representation of the document."""
        self.vector = vector

    def get_summary(self) -> str:
        """Return a brief summary of the document."""
        return f"{self.title}: {self.abstract[:150]}..."
    
    def toJSON(self) -> str:
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True)