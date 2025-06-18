from django.http import HttpResponse, HttpRequest, JsonResponse
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
#from mongo.models.QueryModels import QueryResult, QueryResultFeedback
import openai
#from WeaviateWrapper import WeaviateWrapper, DocumentFilter, InvalidFilterException, DocumentNotFoundException
from models.Document import Document
from search_service import SearchService
from typing import List
import os
import requests
from xml.etree import ElementTree
import json
import numpy as np
from operator import itemgetter
import re
from typing import List, Optional, Tuple
from models.EmbeddingModels import default_embeddingModel_instance
from models.EntailmentModels import default_entailmentModel_instance, AbstractEntailmentModel
import concurrent.futures
from functools import partial
import spacy
from scispacy.linking import EntityLinker
from django.http import StreamingHttpResponse
from openai import AsyncOpenAI
from typing import Dict, List
import asyncio
from django.views.decorators.http import require_http_methods
from asgiref.sync import async_to_sync
from controller.OpenAIController import get_summary
from dotenv import load_dotenv
load_dotenv()

async def queryDocuments(request: HttpRequest, queryText: str) -> HttpResponse:
    request_type = request.GET.get('type', 'all')

    # Get filter parameters
    filters = {
        'publication_types': request.GET.get('pub_types', 'journal article,review').split(','),
        'min_year': request.GET.get('min_year'),
        'max_year': request.GET.get('max_year'),
        'max_results': int(request.GET.get('max_results', '20')),
        'min_citations': request.GET.get('min_citations'),
        'max_citations': request.GET.get('max_citations'),
    }
    # Delivers top n documents
    initial_results = await get_base_query_results(queryText, filters)
    print("Successfully fetched the top documents")
    
    return JsonResponse({"documents": initial_results}, safe=False)

async def get_base_query_results(queryText: str, filters: dict):
    enhanced_query = extract_keywords(queryText, filters)
    query_embedding = get_embedding(queryText)
    
    # PubMed search
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    search_params = {
        "db": "pubmed",
        "term": enhanced_query,
        "retmax": filters.get('max_results') + 30,
        "sort": "relevance",
        "retmode": "json",
        "api_key": os.getenv("PUBMED_API_KEY"),
        "field": "citation_count"

    }
    search_response = requests.get(search_url, params=search_params)
    search_data = search_response.json()
    pmids = search_data.get("esearchresult", {}).get("idlist", [])

    # Fetch metadata
    fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    fetch_params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "api_key": os.getenv("PUBMED_API_KEY")
    }
    fetch_response = requests.get(fetch_url, params=fetch_params)
    root = ElementTree.fromstring(fetch_response.content)

    # Process and sort results
    initial_results = []
    for article in root.findall(".//PubmedArticle"):
        abstract = article.findall(".//Abstract/AbstractText")
        if abstract is None:
            continue

        complete_abstract = []

        for section in abstract:
            label = section.get('Label', '')  # Get section label if exists
            text = section.text or ''         # Get section text
            
            if label:
                complete_abstract.append(f"{label}: {text}")
            else:
                complete_abstract.append(text)
        complete_abstract_text = ' '.join(complete_abstract)
        
        doc_embedding = get_embedding(complete_abstract_text)
        similarity = cosine_similarity(query_embedding, doc_embedding)
        
        initial_results.append({
            "pmid": article.findtext(".//PMID"),
            "title": article.findtext(".//ArticleTitle"),
            "abstract": complete_abstract_text,
            "publicationDate": article.findtext(".//PubDate/Year"),
            "similarity": similarity,
        })

    initial_results.sort(key=itemgetter("similarity"), reverse=True)
    # Get top N documents
    top_documents = initial_results[:filters.get('max_results')]
    pmids = [doc["pmid"] for doc in top_documents]
    citation_data = fetch_icite_citation_data(pmids)
    citation_dict = {}
    if citation_data and 'data' in citation_data:
        citation_dict = {str(paper['pmid']): {
            'total': paper.get('citation_count', 0)  # Only keep total citations
        } for paper in citation_data['data']}

    for doc in top_documents:        
        citation_info = citation_dict.get(doc["pmid"], {'total': 0})
        doc["citations"] = {"total": citation_info['total']}
    return top_documents

async def get_further_reads_results(queryText: str, filters: dict):
    enhanced_query = extract_keywords(queryText, filters)
    
    # PubMed search
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    search_params = {
        "db": "pubmed",
        "term": enhanced_query,
        "retmax": 5,
        "sort": "relevance",
        "retmode": "json",
        "api_key": os.getenv("PUBMED_API_KEY"),
        "field": "citation_count"

    }
    search_response = requests.get(search_url, params=search_params)
    search_data = search_response.json()
    pmids = search_data.get("esearchresult", {}).get("idlist", [])

    # Fetch metadata
    fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    fetch_params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "api_key": os.getenv("PUBMED_API_KEY")
    }
    fetch_response = requests.get(fetch_url, params=fetch_params)
    root = ElementTree.fromstring(fetch_response.content)

    # Process and sort results
    initial_results = []
    for article in root.findall(".//PubmedArticle"):
        abstract = article.findall(".//Abstract/AbstractText")
        if abstract is None:
            continue

        complete_abstract = []

        for section in abstract:
            label = section.get('Label', '')  # Get section label if exists
            text = section.text or ''         # Get section text
            
            if label:
                complete_abstract.append(f"{label}: {text}")
            else:
                complete_abstract.append(text)
        complete_abstract_text = ' '.join(complete_abstract)
        
        initial_results.append({
            "pmid": article.findtext(".//PMID"),
            "title": article.findtext(".//ArticleTitle"),
            "abstract": complete_abstract_text,
            "publicationDate": article.findtext(".//PubDate/Year")
        })

    # Get top N documents
    top_documents = initial_results[:filters.get('max_results')]
    pmids = [doc["pmid"] for doc in top_documents]
    citation_data = fetch_icite_citation_data(pmids)
    citation_dict = {}
    if citation_data and 'data' in citation_data:
        citation_dict = {str(paper['pmid']): {
            'total': paper.get('citation_count', 0)  # Only keep total citations
        } for paper in citation_data['data']}

    for doc in top_documents:        
        citation_info = citation_dict.get(doc["pmid"], {'total': 0})
        doc["citations"] = {"total": citation_info['total']}
    return top_documents

async def get_detailed_analysis_results(top_5, queryText: str):
    pmids = [doc["pmid"] for doc in top_5]
    citation_data = fetch_icite_citation_data(pmids)
    citation_dict = {}
    if citation_data and 'data' in citation_data:
        citation_dict = {str(paper['pmid']): {
            'total': paper.get('citation_count', 0)  # Only keep total citations
        } for paper in citation_data['data']}
    print("Successfully fetched the citations for the top documents")

    detailed_results = [] 
    for doc in top_5:
        relevant_section = RelevantSection(queryText, doc["abstract"])
        agreeableness = Agreeableness(queryText, relevant_section)
        
        citation_info = citation_dict.get(doc["pmid"], {'total': 0})
        detailed_results.append({
            "pmid": doc["pmid"],
            "title": doc["title"],
            "abstract": doc["abstract"],
            "publicationDate": doc["publicationDate"],
            "overallSimilarity": float(doc["similarity"]),
            "citations": {"total": citation_info['total']},
            "relevantSection": {
                "embeddingModel": relevant_section.embeddingModel,
                "mostRelevantSentence": relevant_section.mostRelevantSentence,
                "similarityScore": relevant_section.similarityScore
            },
            "agreeableness": {
                "entailmentModel": agreeableness.entailmentModel,
                "agree": agreeableness.agree,
                "disagree": agreeableness.disagree,
                "neutral": agreeableness.neutral
            }
        })
    return detailed_results

@csrf_exempt
@require_http_methods(["POST"])
def get_relevant_sections(request: HttpRequest) -> JsonResponse:
    try:
        # Parse request data
        data = json.loads(request.body)
        documents = data.get('documents', [])
        query_text = data.get('query', '')

        if not documents or not query_text:
            return JsonResponse({"error": "Missing documents or query"}, status=400)

        # Get query embedding once for all documents
        query_embedding = get_embedding(query_text)
        
        # Map to store pmid -> relevant section
        relevant_sections = {}
        
        # Process each document
        for doc in documents:
            pmid = doc.get("pmid")
            if not pmid:
                continue
                
            abstract = doc.get("abstract", "")
            similarity = cosine_similarity(query_embedding, get_embedding(abstract))
            
            relevant_section = RelevantSection(query_text, abstract)

            relevant_sections[pmid] = {
                "mostRelevantSentence": relevant_section.mostRelevantSentence,
                "similarityScore": float(similarity)
            }

        return JsonResponse({
            "relevantSections": relevant_sections
        })
    
    except Exception as e:
        print(f"Error in get_relevant_sections: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

def get_embedding(text: str):
    """Get embedding vector for text using default embedding model."""
    return default_embeddingModel_instance.embed(text)

def cosine_similarity(v1, v2):
    """Calculate cosine similarity between two vectors."""
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))


class RelevantSection:
    def __init__(self, query: str, abstract: str):
        sentences = re.split(r'(?<=[.!?]) +', abstract)
        maxSimilarity = None
        mostRelevantSentence: str = None
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
    def __init__(self, query: str, relevantSection: RelevantSection):
        model = default_entailmentModel_instance
        prediction: AbstractEntailmentModel.Prediction = model.predict(
            sentence_a=relevantSection.mostRelevantSentence,
            sentence_b=query
        )
        self.entailmentModel = model.identifier
        self.agree: float = prediction.entailment
        self.disagree: float = prediction.contradiction
        self.neutral: Optional[float] = prediction.neutral

def fetch_icite_citation_data(pmids):
    base_url = "https://icite.od.nih.gov/api/pubs"
    params = {"pmids": ",".join(pmids)}
    response = requests.get(base_url, params=params, verify=False)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching citation data: {response.status_code}")
        return None

# Initialize spaCy model with MeSH linker (moved outside function for performance)
nlp = spacy.load("en_core_sci_sm")
nlp.add_pipe("scispacy_linker", config={
    "resolve_abbreviations": True, 
    "linker_name": "mesh"
})

def extract_keywords(user_query: str, filters: dict) -> str:
    """Extract MeSH terms from user query and construct PubMed query."""
    doc = nlp(user_query)
    query_construct = []

    for ent in doc.ents:
        if ent._.kb_ents:
            mesh_ids = ent._.kb_ents
            mesh_terms = [
                nlp.get_pipe("scispacy_linker").kb.cui_to_entity[mesh_id[0]].canonical_name.lower()
                for mesh_id in mesh_ids
            ]
            if mesh_terms:
                # Combine MeSH terms with OR
                query_construct.append(f"({' OR '.join(mesh_terms)})")
        else:
            # Add original term if no MeSH match found
            query_construct.append(ent.text)

    #Add filters once, outside the entity loop
    if filters.get('publication_types'):
        pub_types = [f'"{pt.strip()}"[Publication Type]' for pt in filters['publication_types']]
        if pub_types:
            query_construct.append(f"({' AND '.join(pub_types)})")

    min_year = filters.get('min_year')
    max_year = filters.get('max_year')
    if min_year and max_year:
        query_construct.append(f"{min_year}:{max_year}[Date - Publication]")

    # Construct final query with publication type filters
    pubmed_query = " AND ".join(query_construct)
    print(pubmed_query)
    return pubmed_query


# def extract_keywords(user_query: str, filters: dict) -> str:
#     """Extract MeSH terms and construct a focused PubMed query, using keyword expansion as fallback."""
#     query_parts = []

#     try:
#         # 1. Process query terms
#         doc = nlp(user_query)
#         mesh_terms = []
#         key_concepts = []
        
#         print(f"Processing query: {user_query}")
#         print(f"Found entities: {[ent.text for ent in doc.ents]}")

#         # Extract entities and map to MeSH
#         for ent in doc.ents:
#             if ent._.kb_ents:
#                 try:
#                     mesh_mappings = []
#                     for mesh_id, score in ent._.kb_ents:
#                         try:
#                             if not isinstance(mesh_id, str) or not mesh_id.startswith('C'):
#                                 continue
#                             term = nlp.get_pipe("scispacy_linker").kb.cui_to_entity[mesh_id].canonical_name.lower()
#                             mesh_mappings.append((term, score))
#                         except KeyError as e:
#                             print(f"Invalid MeSH ID: {mesh_id}, Error: {e}")
#                             continue
#                     relevant_terms = [term for term, score in mesh_mappings if score > 0.7]
#                     if relevant_terms:
#                         mesh_terms.extend([f'"{term}"[MeSH Terms]' for term in relevant_terms])
#                         key_concepts.append(ent.text)
#                         print(f"Added MeSH terms for {ent.text}: {relevant_terms}")
#                 except Exception as e:
#                     print(f"Error processing entity {ent.text}: {e}")
#                     continue

#         # If MeSH terms are found, use them
#         if mesh_terms:
#             query_parts.append(" OR ".join(mesh_terms))
#         else:
#             # Fallback: Expand query by tokenizing and removing common stopwords
#             print("No valid MeSH terms found, using expanded text search fallback")
#             stopwords = {"are", "is", "the", "of", "and", "a", "an", "for", "to", "in", "on"}
#             words = [word.strip('?.!,').lower() for word in user_query.split()]
#             keywords = [word for word in words if word and word not in stopwords]
#             if keywords:
#                 # Create an OR query of keywords (e.g. "oranges" OR "healthy")
#                 expanded_query = " OR ".join([f'"{kw}"[Text Word]' for kw in keywords])
#                 query_parts.append(expanded_query)
#             else:
#                 query_parts.append(f'"{user_query}"[Text Word]')

#         # Use publication type filter if provided
#         if filters.get('publication_types'):
#             pub_types = [f'"{pt.strip()}"[Publication Type]' for pt in filters['publication_types']]
#             if pub_types:
#                 # Using OR here as before
#                 query_parts.append(f"({' OR '.join(pub_types)})")

#         # Add date range filter
#         if filters.get('min_year') and filters.get('max_year'):
#             query_parts.append(f"{filters['min_year']}:{filters['max_year']}[Date - Publication]")

#         final_query = " AND ".join(query_parts) if query_parts else f'"{user_query}"[Text Word]'
#         print(f"Final query: {final_query}")
#         return final_query

#     except Exception as e:
#         print(f"Error in extract_keywords: {e}")
#         return f'"{user_query}"[Text Word]'

# @csrf_exempt
# @require_POST
# def submitFeedback(request: HttpRequest, queryResultId: str) -> JsonResponse:
#     try:
#         queryResult: QueryResult = QueryResult.objects.get(id=queryResultId) #Throws QueryResult.DoesNotExist 
#         isPositiveFeedback: bool = request.GET.get('isPositiveFeedback', None)
    
#         # Delete existing feedback, create and save new feedback
#         QueryResultFeedback.objects.filter(queryResult=queryResult).delete()
#         feedback: QueryResultFeedback = QueryResultFeedback(queryResult=queryResult, isPositiveFeedback=isPositiveFeedback)
#         feedback.save()

#         verbalized: str = "Positive" if isPositiveFeedback else "Negative"
#         return JsonResponse({'status': 'success', 'message': f'{verbalized} feedback submitted successfully.'})
    
#     except QueryResult.DoesNotExist:
#         return JsonResponse({'status': 'error', 'message': 'Resource Not Found.'}, status=404)
#     except (KeyError, json.JSONDecodeError, ValidationError):
#         return JsonResponse({'status': 'error', 'message': 'Bad request'}, status=400)
#     except Exception as e:
#         print(e.with_traceback())
#         return JsonResponse({'status': 'error', 'message': 'Internal Server Error.'}, status=500)
