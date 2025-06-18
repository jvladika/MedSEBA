from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import requests
import time
from datetime import datetime
from typing import Dict, Any
from django.core.exceptions import ObjectDoesNotExist
import re

class CitationController:
    """Controller for generating citations in different formats."""
    
    PUBMED_API_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    last_request_time = datetime.min
    MIN_REQUEST_DELAY = 1

@api_view(['GET'])
@permission_classes([AllowAny])
def get_document_citations(request, pmid):
    """API endpoint to get document citations by PMID."""
    try:
        citation_data = _get_citation_data(pmid)
        
        citations = {
            'bibtex': _generate_bibtex(citation_data),
            'mla': _generate_mla(citation_data),
            'apa': _generate_apa(citation_data)
        }
        
        return Response(citations, status=status.HTTP_200_OK)
    except ObjectDoesNotExist as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def _get_citation_data(pmid: str) -> Dict[str, Any]:
    """Get citation data from PubMed API."""
    current_time = datetime.now()
    time_since_last_request = (current_time - CitationController.last_request_time).total_seconds()
    
    if time_since_last_request < CitationController.MIN_REQUEST_DELAY:
        time.sleep(CitationController.MIN_REQUEST_DELAY - time_since_last_request)
    
    try:
        params = {
            'db': 'pubmed',
            'id': pmid,
            'retmode': 'json'
        }
        response = requests.get(CitationController.PUBMED_API_URL, params=params, timeout=5)
        CitationController.last_request_time = datetime.now()
        
        if response.status_code != 200:
            raise Exception(f"PubMed API returned status code {response.status_code}")
        
        data = response.json()
        if 'result' not in data or pmid not in data['result']:
            raise ObjectDoesNotExist(f"No citation data found for PMID: {pmid}")
            
        article = data['result'][pmid]
        return {
            'authors': [{'name': author['name']} for author in article.get('authors', [])],
            'title': article.get('title', ''),
            'journal': article.get('fulljournalname', ''),
            'year': article.get('pubdate', '').split()[0],
            'volume': article.get('volume', ''),
            'issue': article.get('issue', ''),
            'pages': article.get('pages', ''),
            'doi': article.get('doi', ''),
            'pmid': pmid
        }
        
    except requests.exceptions.Timeout:
        raise Exception("Request to PubMed API timed out")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch citation data: {str(e)}")

def _generate_bibtex(data: Dict[str, Any]) -> str:
    """Generate BibTeX format citation."""
    try:
        authors = ' and '.join(author['name'] for author in data.get('authors', []))
        year = data.get('year', '')
        
        bibtex = f"""@article{{{data['pmid']},
        author = {{{authors}}},
        title = {{{data['title']}}},
        journal = {{{data['journal']}}},
        year = {{{year}}},
        volume = {{{data['volume']}}},
        number = {{{data['issue']}}},
        pages = {{{data['pages']}}},
        doi = {{{data['doi']}}},
        pmid = {{{data['pmid']}}}
        }}"""
        
        return bibtex
    except Exception as e:
        raise Exception(f"Failed to generate BibTeX citation: {str(e)}")

def _generate_mla(data: Dict[str, Any]) -> str:
    """Generate MLA format citation."""
    try:
        authors = [author['name'] for author in data.get('authors', [])]
        if not authors:
            author_text = "No author"
        elif len(authors) == 1:
            author_text = authors[0]
        else:
            author_text = f"{authors[0]}, et al."

        citation = f"{author_text}. \"{data['title']}\""
        if data['journal']:
            citation += f". {data['journal']}"
        if data['volume']:
            citation += f", vol. {data['volume']}"
        if data['issue']:
            citation += f", no. {data['issue']}"
        if data['year']:
            citation += f", {data['year']}"
        if data['pages']:
            citation += f", pp. {data['pages']}"
        citation += "."
        
        return citation
    except Exception as e:
        raise Exception(f"Failed to generate MLA citation: {str(e)}")

def _generate_apa(data: Dict[str, Any]) -> str:
    """Generate APA format citation."""
    try:
        authors = [author['name'] for author in data.get('authors', [])]
        if not authors:
            author_text = "No author"
        elif len(authors) == 1:
            author_text = authors[0]
        elif len(authors) == 2:
            author_text = f"{authors[0]} & {authors[1]}"
        else:
            author_text = ", ".join(authors[:-1])
            author_text += f", & {authors[-1]}"

        citation = f"{author_text}"
        if data['year']:
            citation += f" ({data['year']})"
        citation += f". {data['title']}"
        if data['journal']:
            citation += f". {data['journal']}"
        if data['volume']:
            citation += f", {data['volume']}"
            if data['issue']:
                citation += f"({data['issue']})"
        if data['pages']:
            citation += f", {data['pages']}"
        citation += "."
        
        return citation
    except Exception as e:
        raise Exception(f"Failed to generate APA citation: {str(e)}")
