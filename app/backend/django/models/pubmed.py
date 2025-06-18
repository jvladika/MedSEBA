from datetime import datetime
from typing import List, Optional, Tuple, Dict
import json
import re
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import requests
import xml.etree.ElementTree as ET
import os

# ========================== Document and Models ==========================

class Document:
    """Represents a research document with metadata and vector representation."""

    class QuerySpecificData:
        """Encapsulates data specific to a query, like relevance and agreeableness."""

        def __init__(self, document: 'Document', query: str):
            self.query = query
            self.relevantSection = Document.QuerySpecificData.RelevantSection(query, document.abstract)
            self.agreeableness = Document.QuerySpecificData.Agreeableness(query, self.relevantSection)

        class RelevantSection:
            """Identifies the most relevant section of a document for a query."""

            def __init__(self, query: str, abstract: str):
                sentences = re.split(r'(?<=[.!?]) +', abstract)
                maxSimilarity = None
                mostRelevantSentence = None
                model = default_embeddingModel_instance
                for sentence in sentences:
                    similarity = model.unitCosineSimilarity(query, sentence, prune=False)
                    if maxSimilarity is None or similarity > maxSimilarity:
                        maxSimilarity = similarity
                        mostRelevantSentence = sentence
                self.embeddingModel = model.identifier
                self.mostRelevantSentence = mostRelevantSentence
                self.similarityScore = maxSimilarity

        class Agreeableness:
            """Calculates entailment, contradiction, and neutrality for a document-query pair."""

            def __init__(self, query: str, relevantSection: 'Document.QuerySpecificData.RelevantSection'):
                model = default_entailmentModel_instance
                prediction = model.predict(
                    sentence_a=relevantSection.mostRelevantSentence,
                    sentence_b=query
                )
                self.entailmentModel = model.identifier
                self.agree = prediction.entailment
                self.disagree = prediction.contradiction
                self.neutral = prediction.neutral

    def __init__(self, identifier: str, title: str, abstract: str, publicationDate: datetime):
        self.identifier = identifier
        self.title = title
        self.abstract = abstract
        self.publicationDate = publicationDate
        self.queryRelated = None

    def loadDataSpecificTo(self, query: str):
        self.queryRelated = Document.QuerySpecificData(self, query)

    def toJSON(self) -> str:
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True)

class AbstractEmbeddingModel:
    """Wraps an embedding model for consistent interface usage."""

    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name)
        self.identifier = model_name

    def embedText(self, text: str) -> np.ndarray:
        return np.array(self.model.encode(text))

    def unitCosineSimilarity(self, text1: str, text2: str, prune: bool = True) -> float:
        embedding1 = self.embedText(text1)
        embedding2 = self.embedText(text2)
        if embedding1.size == 0 or embedding2.size == 0:
            return 0.0
        similarity = cosine_similarity([embedding1], [embedding2])[0][0]
        if prune:
            similarity = max(0, similarity)
        else:
            similarity = (similarity + 1) / 2
        return similarity

class AbstractEntailmentModel:
    """Base class for entailment models."""

    def __init__(self, model_name: str):
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.identifier = model_name

    def predict(self, sentence_a: str, sentence_b: str):
        inputs = self.tokenizer(sentence_a, sentence_b, return_tensors="pt")
        outputs = self.model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        return {
            "entailment": probs[0].item(),
            "neutral": probs[1].item(),
            "contradiction": probs[2].item()
        }

# Default models
default_embeddingModel_instance = AbstractEmbeddingModel('pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT')
default_entailmentModel_instance = AbstractEntailmentModel('MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli')

# ========================== Workflow Functions ==========================

def search_and_fetch_pubmed(query, retmax=500, fetch_limit=250):
    """
    Search PubMed for a query and fetch metadata for the top articles.
    
    Args:
        query (str): The search query.
        retmax (int): Maximum number of PMIDs to retrieve.
        fetch_limit (int): Number of articles to fetch metadata for.
        
    Returns:
        List[Dict]: A list of metadata dictionaries for the fetched articles.
    """
    # Stage 1: Search PubMed for PMIDs
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    search_params = {
        "db": "pubmed",
        "term": query,
        "retmax": retmax,
        "retmode": "json",
        "api_key": os.getenv.PUBMED_API_KEY
    }
    search_response = requests.get(search_url, params=search_params)
    search_data = search_response.json()
    pmids = search_data.get("esearchresult", {}).get("idlist", [])

    if not pmids:
        print("No articles found for the given query.")
        return []

    print(f"Retrieved {len(pmids)} PMIDs. Fetching metadata for top {fetch_limit} articles...")

    # Stage 2: Fetch Metadata for PMIDs
    fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    fetch_params = {
        "db": "pubmed",
        "id": ",".join(pmids[:fetch_limit]),
        "retmode": "xml",
        "api_key": os.getenv.PUBMED_API_KEY
    }
    fetch_response = requests.get(fetch_url, params=fetch_params)
    print("Fetch response status code:", fetch_response)
    
    if fetch_response.status_code != 200:
        print("Error fetching metadata:", fetch_response.text)
        return []

    metadata = fetch_response.text  # XML response as text

    # Parse the XML response
    root = ET.fromstring(metadata)
    articles = []
    for article in root.findall(".//PubmedArticle"):
        pmid = article.findtext(".//PMID")
        title = article.findtext(".//ArticleTitle")
        abstract = article.findtext(".//Abstract/AbstractText")
        if abstract is None:
            continue
        pub_date = article.findtext(".//PubDate/Year")
        if not pub_date:
            pub_date = article.findtext(".//PubDate/MedlineDate")
        articles.append({
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "publicationDate": pub_date
        })
    return articles


def embed_and_rank_documents(query: str, documents: List[Dict]) -> List[Dict]:
    query_embedding = default_embeddingModel_instance.embedText(query)
    document_embeddings = [default_embeddingModel_instance.embedText(doc["abstract"]) for doc in documents]
    similarities = cosine_similarity([query_embedding], document_embeddings)[0]
    ranked_indices = similarities.argsort()[::-1][:10]  # Get top 10 most similar documents
    return [documents[i] for i in ranked_indices]

def rank_sentences_in_documents(query: str, top_documents: List[Dict]):
    query_embedding = default_embeddingModel_instance.embedText(query)
    ranked_results = []
    for doc in top_documents:
        sentences = re.split(r'(?<=[.!?]) +', doc["abstract"])
        sentence_embeddings = [default_embeddingModel_instance.embedText(sentence) for sentence in sentences]
        similarities = cosine_similarity([query_embedding], sentence_embeddings)[0]
        top_sentence_index = similarities.argmax()
        ranked_results.append({
            "document": doc,
            "top_sentence": sentences[top_sentence_index],
            "similarity_score": similarities[top_sentence_index]
        })
    return ranked_results

# ========================== API Endpoint ==========================

def queryDocuments(queryText: str, alpha: float = 0.3, numResults: int = 5, offset: int = 0):
    # Stage 1: Fetch documents
    documents = search_and_fetch_pubmed(queryText)

    # Stage 2: Embed and rank documents
    ranked_documents = embed_and_rank_documents(queryText, documents)[:numResults]

    # Stage 3: Rank sentences in top documents
    final_results = rank_sentences_in_documents(queryText, ranked_documents)

    def convert_to_serializable(obj):
        if isinstance(obj, np.float32):
            return float(obj)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    return json.dumps(final_results, indent=2, default=convert_to_serializable)

# ========================== Example Usage ==========================
if __name__ == "__main__":
    query = "sitting and health risks"
    response = queryDocuments(query)
    #print(response)
