import requests
from typing import List, Dict
import xml.etree.ElementTree as ET
from datetime import datetime

class PubMedFetcher:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        self.base_fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

    def search_articles(self, query: str, max_results: int = 500) -> List[str]:
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json",
            "api_key": self.api_key
        }
        response = requests.get(self.base_search_url, params=params)
        return response.json()["esearchresult"]["idlist"]

    def fetch_metadata(self, pmids: List[str]) -> List[Dict]:
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml",
            "api_key": self.api_key
        }
        response = requests.get(self.base_fetch_url, params=params)
        root = ET.fromstring(response.text)
        
        articles = []
        for article in root.findall(".//PubmedArticle"):
            try:
                abstract = article.find(".//Abstract/AbstractText")
                abstract_text = abstract.text if abstract is not None else ""
                
                title = article.find(".//ArticleTitle")
                title_text = title.text if title is not None else ""
                
                pmid = article.find(".//PMID").text
                
                date_elem = article.find(".//PubDate")
                year = date_elem.find("Year").text if date_elem.find("Year") is not None else "1900"
                
                articles.append({
                    "identifier": pmid,
                    "title": title_text,
                    "abstract": abstract_text,
                    "publicationDate": f"{year}-01-01T00:00:00Z"
                })
            except Exception as e:
                print(f"Error processing article {pmid}: {e}")
                continue
                
        return articles