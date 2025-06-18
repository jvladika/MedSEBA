from typing import List, Dict
from pubmed_fetcher import PubMedFetcher
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

class SearchService:
    def __init__(self):
        self.pubmed = PubMedFetcher(api_key=os.getenv('PUBMED_API_KEY'))
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        
    def search_documents(self, query: str, num_results: int = 10) -> List[Dict]:
        # Get PMIDs from PubMed
        pmids = self.pubmed.search_articles(query)
        articles = self.pubmed.fetch_metadata(pmids)
        
        # Create embeddings
        query_embedding = self.encoder.encode(query)
        doc_embeddings = self.encoder.encode([doc['abstract'] for doc in articles])
        
        # Calculate similarities
        similarities = cosine_similarity([query_embedding], doc_embeddings)[0]
        
        # Get top results
        top_indices = similarities.argsort()[-num_results:][::-1]
        results = [articles[i] for i in top_indices]
        
        return results