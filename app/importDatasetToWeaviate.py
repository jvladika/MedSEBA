from backend.django.pubmed_fetcher import PubMedFetcher
from backend.django.WeaviateWrapper import WeaviateWrapper
from backend.django.models.Document import Document
import os
from dotenv import load_dotenv

load_dotenv()

def import_pubmed_data():
    # Initialize
    fetcher = PubMedFetcher(api_key=os.getenv('PUBMED_API_KEY'))
    wrapper = WeaviateWrapper()
    
    # Search query
    query = "cancer treatment therapy"
    pmids = fetcher.search_articles(query)
    
    # Fetch and import batches
    batch_size = 100
    for i in range(0, len(pmids), batch_size):
        batch = pmids[i:i + batch_size]
        articles = fetcher.fetch_metadata(batch)
        
        for article in articles:
            doc = Document(
                identifier=article["identifier"],
                title=article["title"],
                abstract=article["abstract"],
                publicationDate=article["publicationDate"]
            )
            wrapper.storeDocument(doc)

if __name__ == "__main__":
    import_pubmed_data()