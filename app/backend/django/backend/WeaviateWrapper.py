# This file contains all logic tied to accessing the weaviate vector database.
import weaviate
from typing import List, Tuple, Optional, Type, Union
from .models.EmbeddingModels import AbstractEmbeddingModel, default_embeddingModel_instance
from .models.Document import Document
from datetime import datetime
from .controller import SemanticScholarController
class DocumentNotFoundException(Exception):
    """Exception raised when a document is not found."""

    def __init__(self, documentId="", message="Document with id was not found"):
        self.documentId = documentId
        self.message = f"{message}: {documentId}"
        super().__init__(self.message)

class InvalidFilterException(Exception):
    """Exception raised when an invalid filter argument is given."""

    def __init__(self, valueErrorMessage="", message="Bad filter argument"):
        self.message = f"{message}: {valueErrorMessage}"
        super().__init__(self.message)


class WeaviateWrapper():
    """
    This class holds all logic that is tied to accessing the weaviate database, such as searching or storing documents.
    """
    
    class FilterBuilder:
        """
        This class centralizs all operations that are used to build filter dictionaries which can be passed directy to weaviate.
        As such, this class should only be acessed from within this file.
        """
        def __init__(self):
            self.filters = {"operator": "And", "operands": []}

        def addCollection(self, collection: 'AbstractFilterCollection'):
            collection._applyWith(self)

        def addRangeFilter(self, path: List[str], operator: str, value: Optional[int]):
            if value is not None:
                self.filters["operands"].append({"path": path, "operator": operator, "valueInt": value})
 
        def addStringFilter(self, path: List[str], operator: str, value: Optional[str]):
            if value is not None:
                self.filters["operands"].append({"path": path, "operator": operator, "valueString": value})

        def addStringListFilter(self, path: List[str], operator: str, value: Optional[List[str]]):
            if len(value):
                self.filters["operands"].append({"path": path, "operator": operator, "valueString": value})

        def addDateFilter(self, path: List[str], operator: str, value: Optional[str]):
            if value is not None:
                formatted_value = datetime.strptime(value , '%Y').isoformat()+ "Z" 
                self.filters["operands"].append({"path": path, "operator": operator, "valueDate": formatted_value})

        def build(self):
            return self.filters

    def __init__(self,
                 client = weaviate.Client(url="http://localhost:8080",auth_client_secret=None),
                 embeddingModel: Optional[Type[AbstractEmbeddingModel]] = default_embeddingModel_instance
    ) -> None:
        self.client = client
        self.model = embeddingModel

    def searchDocuments(
            self,
            query:str,
            filters: 'DocumentFilter',
            alpha: int = 0.5,
            numResults: int = 5,
            offset : int= 0
    ) -> Tuple[float, Document]:
        try:
            builder = WeaviateWrapper.FilterBuilder()
            builder.addCollection(filters)
            builder.addStringFilter(["embeddingModel"], "Equal", self.model.identifier) # A default filter
            filterStructure = builder.build()
        except ValueError as e:
            raise InvalidFilterException(valueErrorMessage=str(e))
        
        # Perform the actual search
        try:
            #Hybrid Search
            response = (self.client.query
                .get("Document",["abstract","title"])
                .with_where(filterStructure)
                .with_hybrid(
                    query=query,  # Query string
                    properties=["abstract","title"],  # Searched properties
                    vector=self.model.embedText(text = query),  # Manually provide a vector; if not, Weaviate will vectorize the query string
                    alpha=alpha, # alpha = 0 means pure BM25, and alpha = 1 means pure vector
                    #fusion_type=weaviate.gql.get.HybridFusion.RELATIVE_SCORE,
                )
                .with_additional(["score", "explainScore","id"])  # Include score & explainScore in the response
                .with_limit(numResults)
                .with_offset(offset)
                .do()
            )
            
            results = response['data']['Get']["Document"]
            if results == None or len(results) == 0:
                # If weavaite does not return ANY documents alltough no filters are specified, you should upload some.
                # Make sure to create a schema before, by calling http://localhost:8000/document/createWeaviateClass
                raise DocumentNotFoundException(message="No documents found in database.")

            # Extract document identifiers and similarity scores
            similarDocuments = [(result['_additional']["score"], self.loadDocumentFromId(result['_additional']['id'])) for result in results]
            self.searchSemanticScholar(results=similarDocuments)
            filteredDocuments = filters.postFilterResults(similarDocuments)
            return filteredDocuments

        except Exception as e:
            print(f"Weaviate search error: {e}")
            return []
        
    def storeDocument(self,document: Document, verbose:bool=True) -> None:        
        """
        Embed the abstract, store the document and the embedding in Weaviate,
        and return an error if the object is already stored.
        """
        try:           
            # Convert the Document object into a dictionary format that can be accepted by Weaviate
            document_data = {
                "identifier": "",
                "externalIdentifier": document.externalIdentifier,
                "title": document.title,
                "abstract": document.abstract,
                "publicationDate": document.publicationDate,
                "citedBy": document.citedBy,
                "references": document.references,
                "source": document.source,
                "embeddingModel" : self.model.identifier
            }
            objectUuid= weaviate.util.generate_uuid5(document_data)
            document_data["identifier"] = objectUuid

            # Check if the document already exists in Weaviate with the given model
            existingDocs = self.client.data_object.get_by_id(
                objectUuid,
                class_name = "Document",
                with_vector = False
            )

            if existingDocs:
                raise ValueError(f"Document {objectUuid} already exists in the database with the model {self.model.identifier}.")
                        
            # Use Weaviate client to import data
            self.client.data_object.create(
                data_object=document_data,
                class_name="Document",
                uuid = objectUuid,
                vector = self.model.embedText(text = document.abstract)
            )

            if verbose:
                print(f"Document {objectUuid} imported successfully.")
        except Exception as e:
            if verbose:
                print(f"Error: {e}")
            raise ValueError(f"Document {objectUuid} already exists in the database with the model {self.model.identifier}.")
 
    def createDocumentClass(self):
        documentClass = {
            "class": "Document",
            "description": "A document (e.g., a research paper) retrieved from a vector-based search engine like Weaviate.",
            "vectorIndexConfig": {
                "distance":"cosine"
            },
            "properties": [
                {"name": "identifier", "dataType": ["text"], "description": "Unique identifier within Weaviate."},
                {"name": "externalIdentifier", "dataType": ["text"], "description": "Identifier used by the dataset."},
                {"name": "title", "dataType": ["text"], "description": "Title of the document."},
                {"name": "abstract", "dataType": ["text"], "description": "Abstract of the document."},
                {"name": "publicationDate", "dataType": ["date"], "description": "Publication date of the document."},
                {"name": "citedBy", "dataType": ["text[]"], "cardinality": "atMostOne", "description": "List of identifiers of documents that cite this document."},
                {"name": "references", "dataType": ["text[]"], "cardinality": "atMostOne", "description": "List of identifiers of documents cited by this document."},
                {"name": "source", "dataType": ["text"], "description": "Source or dataset name/ID."},
                {"name": "modelIdentifier", "dataType": ["text"], "description": "Identifier of the model used for embedding the document."},
                {"name": "referenceCount", "dataType": ["int"], "description": "Number of References"},
                {"name": "citationCount", "dataType": ["int"], "description": "Number of Citations"},
                {"name": "journal", "dataType": ["text"], "description": "Name of the Journal that the paper published."},
                {"name": "semanticScholarPaperId", "dataType": ["text"], "description": "semantic Scholar PaperId"},
                {"name": "authors", "dataType": ["text[]"], "description": "Name of the Authors"}
            ]
        }
        className = "Document"
        # Create the new class in the Weaviate schema
        # Apply the schema
        try:
            #if the class exist in weavite, update the properties
            if  self.client.schema.exists(class_name=className):
                self.client.schema.property.create(className, {"name": "referenceCount","dataType": ["int"], "description": "Number of References"})
                self.client.schema.property.create(className, {"name": "citationCount", "dataType": ["int"], "description": "Number of Citations"})
                self.client.schema.property.create(className, {"name": "journal", "dataType": ["text"], "description": "Name of the Journal that the paper published."})
                self.client.schema.property.create(className, {"name": "semanticScholarPaperId", "dataType": ["text"], "description": "semantic Scholar PaperId"})
                self.client.schema.property.create(className, {"name": "authors", "dataType": ["text[]"], "description": "Name of the Authors"})

            else: #if the class does not exist in weavite, create class
                self.client.schema.create_class(documentClass)
        except Exception as e:
            print(f"Error applying schema: {e}")
            
    def loadDocumentFromId(self, documentId) -> Document:
            # Retrieve full document details
            object = self.client.data_object.get_by_id(
                documentId,
                class_name = "Document",
                with_vector = False
            )

            if object == None:
                raise DocumentNotFoundException(documentId=documentId)

            documentData = object['properties']
            # Create a Document object
            document = Document(
                identifier=documentData['identifier'],
                externalIdentifier=documentData['externalIdentifier'],
                title=documentData['title'],
                abstract=documentData['abstract'],
                publicationDate=documentData['publicationDate'],
                citedBy=documentData['citedBy'],
                references=documentData['references'],
                source=documentData['source'],
                embeddingModel=documentData['embeddingModel'],
                citationCount=documentData.get("citationCount",0),
                referenceCount=documentData.get("referenceCount",0),
                journal=documentData.get("journal",""),
                semanticScholarPaperId=documentData.get("semanticScholarPaperId",""),
                authors=documentData.get("authors",[]),
                vector=None
            )
            #try to update data with searching by title, if it was not updated by PMID search
            
            if document.semanticScholarPaperId == "":
                paperData = SemanticScholarController.searchSemanticScholarWithTitle(documentTitle=document.title)
                if paperData:
                    updatedDocument = self.updateDocumentMetadata(document=document,semanticScholarData=paperData)
                    if updatedDocument:
                        document = updatedDocument

            return document

    def updateDocumentMetadata(self,document:Document,semanticScholarData):
        try:
            document.semanticScholarPaperId = semanticScholarData.get("paperId", "")  
            document.referenceCount = semanticScholarData.get("referenceCount", 0) 
            document.citationCount = semanticScholarData.get("citationCount", 0) 
            document.journal =  semanticScholarData.get("journal", {}).get("name","") 
            document.authors = [ author.get("name", "") for author in semanticScholarData.get("authors", [])] 
            document.references = [ reference.get("paperId", "")  for reference in semanticScholarData.get("references", []) if reference.get("paperId") is not None] 
            document.citedBy = [ citation.get("paperId", "") for citation in semanticScholarData.get("citations", []) if citation.get("paperId") is not None] 
            
            self.client.data_object.update(
                uuid=document.identifier,
                class_name="Document",
                data_object={
                    "references": document.references,
                    "referenceCount": document.referenceCount,
                    "citedBy": document.citedBy,
                    "citationCount": document.citationCount,
                    "authors": document.authors,
                    "semanticScholarPaperId": document.semanticScholarPaperId,
                    "journal": document.journal,
                })
            return document
            
        except Exception as e:
            print(f"Weaviate object update error: {e} documentID: {document.identifier}")
            return document

    def searchSemanticScholar(self,results:Tuple[float, Document]):
        ids = []
        for score,document in results:
            ids.append(document.externalIdentifier)

        paperData =SemanticScholarController.searchSemanticScholarWithPMID(ids)
        for index, paperData in enumerate(paperData):
            document = results[index][1]
            if paperData:
                self.updateDocumentMetadata(document=document,semanticScholarData=paperData)


class AbstractFilterCollection:
    """
    Represents a set of filter cirteria to be incoporated by a WeaviateWrapper.FilterBuilder. 
    """

    def __init__(self) -> None:
        raise NotImplementedError("This is an abstract class; 'init' is not implemented.")

    def _applyWith(
        self,
        filterBuild: WeaviateWrapper.FilterBuilder
    ) -> WeaviateWrapper.FilterBuilder:
        """
        Applies the set of filters to the given filterBuild.
        This is called by the FilterBuilder itself.
        """
        raise NotImplementedError("This is an abstract class; '_applyWith' is not implemented.")

class DocumentFilter(AbstractFilterCollection):
    """
    Encompasses the set of singlular filter cirteria to be applied within WeaviateWrapper.searchDocuments(). 
    """
    def __init__(
        self,
        min_citations: Optional[int] = None,
        max_citations: Optional[int] = None,
        min_references: Optional[int] = None,
        max_references: Optional[int] = None,
        journals: Optional[List[str]] = None,
        published_before: Optional[str] = None,
        published_after: Optional[str] = None
    ) -> None:
        self.min_citations = min_citations
        self.max_citations = max_citations
        self.min_references = min_references
        self.max_references = max_references
        self.journals = journals
        self.published_before =  published_before
        self.published_after = published_after

    def _applyWith(
            self,
            filterBuild: WeaviateWrapper.FilterBuilder
    ) -> WeaviateWrapper.FilterBuilder:
        """
        Applies the set of filters to the given filterBuild.
        Some of them are commented because they conflict with Semantic Scholar filters
        """
        #filterBuild.addRangeFilter(["citationCount"], "GreaterThanEqual", self.min_citations)
        #filterBuild.addRangeFilter(["citationCount"], "LessThanEqual", self.max_citations)
        #filterBuild.addRangeFilter(["referenceCount"], "GreaterThanEqual", self.min_references)
        #filterBuild.addRangeFilter(["referenceCount"], "LessThanEqual", self.max_references)
        #filterBuild.addStringListFilter(["journal"], "ContainsAny", self.journals) 
        filterBuild.addDateFilter(["publicationDate"], "GreaterThanEqual", self.published_after)
        filterBuild.addDateFilter(["publicationDate"], "LessThanEqual", self.published_before)
    
    def postFilterResults(self, results:Tuple[float, Document]):    
        filteredResults = results.copy()
        for result in results:
            document:Document = result[1]
            if self.min_citations:
                if document.citationCount < int(self.min_citations):
                    filteredResults.remove(result)
                    continue
            if self.max_citations:
                if document.citationCount > int(self.max_citations):
                    filteredResults.remove(result)
                    continue
            if self.min_references:
                if document.referenceCount < int(self.min_references):
                    filteredResults.remove(result)
                    continue
            if self.max_references:
                if document.referenceCount < int(self.max_references):
                    filteredResults.remove(result)
                    continue
            if self.journals:
                if document.journal not in self.journals:
                    filteredResults.remove(result)
                    continue
                    
        return filteredResults