from typing import List, Tuple
from ..models.Document import Document
import requests

def searchSemanticScholarWithTitle(documentTitle):
    base_url = "https://api.semanticscholar.org/graph/v1/paper/search"
    data = {"query": f"title:({documentTitle})",
            "fields": "paperId,referenceCount,citationCount,journal,authors,references,citations",
            "limit":1,
            }
    try:
        response = requests.get(url=base_url, params=data)
        if response.status_code == 200 and response.json().get("total", 0):
            search_results = response.json().get("data", [])[0]
            return search_results
        else:
            return False
         
    except Exception as e:
        print(f"Error: Unable to perform Semantic Scholar search. Error: {e}")
     

def searchSemanticScholarWithPMID( ids:list[str]):
    base_url = "https://api.semanticscholar.org/graph/v1/paper/batch"
    params = {
            "fields": "paperId,referenceCount,citationCount,journal,authors,references,citations",
            }
    body = {"ids": [ f"PMID:{pmid}" for pmid in ids ]}
    try:
        response = requests.post(url=base_url, params=params,json=body)
        if response.status_code == 200:
            search_results = response.json()
            return search_results
        else:
            return False
         
    except Exception as e:
        print(f"Error: Unable to perform Semantic Scholar search. Error: {e}")
     
    
 