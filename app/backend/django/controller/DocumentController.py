from django.shortcuts import render
import json
from django.http import HttpResponse, HttpRequest, JsonResponse
from django.views.decorators.http import require_GET, require_POST
from bson.json_util import dumps,loads
from django.views.decorators.csrf import csrf_exempt
from models.EmbeddingModels import AbstractEmbeddingModel, sPubMedBERT, simSce
#from WeaviateWrapper import WeaviateWrapper, DocumentNotFoundException
from models.Document import Document

@require_GET
def getDocument(request: HttpRequest, documentId: str) -> HttpResponse:
    """Get document details from PubMed by ID."""
    try:
        query: Optional[str] = request.GET.get('query')
        
        # Load document from PubMed API
        document = Document(
            pmid=documentId,
            title="",  # Will be populated from PubMed
            abstract="",
            publicationDate=""
        )
        
        if query:
            document.loadDataSpecificTo(query)
            
        return JsonResponse(
            json.loads(document.toJSON()), 
            safe=False, 
            json_dumps_params={'indent': 2}
        )
        
    except Exception as e:
        print(f"Error fetching document {documentId}: {str(e)}")
        return JsonResponse(
            {'status': 'error', 'message': 'Internal Server Error'}, 
            status=500
        )

@csrf_exempt
def store(request: HttpRequest) -> HttpResponse:
    """Store PubMed document data."""
    try:
        document = Document(
            pmid=request.POST["pmid"],
            title=request.POST["title"],
            abstract=request.POST["abstract"],
            publicationDate=request.POST["publicationDate"],
            journal=request.POST.get("journal", ""),
            authors=request.POST.getlist("authors", [])
        )
        
        # Save document (implement storage logic as needed)
        
        return JsonResponse({
            "status": "success",
            "message": "Document stored successfully",
            "document": json.loads(document.toJSON())
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)