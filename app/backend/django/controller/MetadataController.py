from django.http import JsonResponse
from semanticscholar import SemanticScholar
from typing import List, Dict
from rest_framework import status
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import requests
from xml.etree import ElementTree
import os

def enrich_metadata(pmids: List[str]) -> List[Dict]:
    sch = SemanticScholar()
    enriched_metadata = []
    
    for pmid in pmids:
        try:
            paper = sch.get_paper(f"PMID:{pmid}")
            if not paper:
                raise ObjectDoesNotExist(f"Paper with PMID:{pmid} not found")
                
            metadata = {
                "pmid": pmid,
                "title": paper.title,
                "abstract": paper.abstract,
                "source_url": paper.url,
                "year": paper.year,
                "reference_count": paper.referenceCount,
                "publication_venue": paper.publicationVenue,
                "citation_count": paper.citationCount,
                "influential_citation_count": paper.influentialCitationCount,
                "fields_of_study": paper.fieldsOfStudy,
                "journal": {
                    "name": paper.journal.name if paper.journal else "Unknown",
                    "pages": paper.journal.pages if paper.journal else "Unknown",
                    "volume": paper.journal.volume if paper.journal else "Unknown"
                },
                "authors": [
                    {
                        "authorId": author.authorId,
                        "name": author.name,
                        "url": f"https://www.semanticscholar.org/author/{author.authorId}",
                        "affiliations": author.affiliations,
                    } for author in paper.authors
                ]
            }
            enriched_metadata.append(metadata)
            
        except Exception as e:
            raise e
    
    return enriched_metadata

@api_view(['GET'])
@permission_classes([AllowAny])
def get_document_metadata(request, pmid):
    """API endpoint to get document metadata by PMID."""
    try:
        metadata = enrich_metadata([pmid])
        return Response(metadata[0], status=status.HTTP_200_OK)
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

@api_view(['GET'])
@permission_classes([AllowAny])
def get_pubmed_document_metadata(request, pmid):
    """API endpoint to get document metadata by a single PMID."""
    try:
        fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        fetch_params = {
            "db": "pubmed",
            "id": pmid,
            "retmode": "xml",
            "api_key": os.getenv("PUBMED_API_KEY")
        }
        fetch_response = requests.get(fetch_url, params=fetch_params)
        
        if fetch_response.status_code != 200:
            return Response({"error": "Failed to fetch metadata"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        root = ElementTree.fromstring(fetch_response.content)
        article = root.find(".//PubmedArticle")
        
        if article is None:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        title = article.findtext(".//ArticleTitle")
        abstract = article.findtext(".//Abstract/AbstractText")
        pub_date = article.findtext(".//PubDate/Year") or article.findtext(".//PubDate/MedlineDate")

        document_data = {
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "year": pub_date
        }
        
        return Response(document_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
