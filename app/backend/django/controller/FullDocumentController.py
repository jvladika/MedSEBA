from django.shortcuts import get_object_or_404
from django.http import HttpResponse, HttpRequest, JsonResponse
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from api.document_models import Document
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

def document_to_dict(document: Document) -> dict:
    """Convert Document model to dictionary."""
    return {
        'document_id': document.document_id,
        'pmid': document.pmid,
        'user': document.user.id,
        'title': document.title,
        'abstract': document.abstract,
        'source_url': document.source_url,
        'year': document.year,
        'reference_count': document.reference_count,
        'publication_venue': document.publication_venue,
        'venue': document.venue,
        'citation_count': document.citation_count,
        'influential_citation_count': document.influential_citation_count,
        'fields_of_study': document.fields_of_study,
        'journal': document.journal,
        'authors': document.authors,
        'overall_similarity': document.overall_similarity,
        'embedding_model': document.embedding_model,
        'most_relevant_sentence': document.most_relevant_sentence,
        'similarity_score': document.similarity_score,
        'entailment_model': document.entailment_model,
        'agree': document.agree,
        'disagree': document.disagree,
        'neutral': document.neutral
    }

@require_GET
def getFullDocument(request: HttpRequest, document_id: str) -> HttpResponse:
    """Get document by ID."""
    try:
        document = get_object_or_404(Document, document_id=document_id)
        return JsonResponse({
            'status': 'success',
            'document': document_to_dict(document)
        })
    except Exception as e:
        return JsonResponse(
            {'status': 'error', 'message': str(e)}, 
            status=500
        )
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getFullDocumentByPmid(request: HttpRequest, pmid: str) -> HttpResponse:
    """Get document by PMID."""
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'User is not authenticated'}, status=401)

    try:
        document = get_object_or_404(Document, pmid=pmid, user=request.user)
        return JsonResponse({'status': 'success', 'document': document_to_dict(document)})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def storeFullDocument(request: HttpRequest) -> HttpResponse:
    """Create new document."""
    try:
        data = json.loads(request.body)
        data['user'] = request.user
        document = Document.objects.create(**data)
        return JsonResponse({
            'status': 'success',
            'document': document_to_dict(document)
        }, status=201)
    except Exception as e:
        print(f"Error in storeFullDocument: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def updateFullDocument(request: HttpRequest, document_id: str) -> HttpResponse:
    """Update existing document."""
    try:
        document = get_object_or_404(Document, document_id=document_id)
        data = json.loads(request.body)
        
        updateable_fields = [
            'pmid', 'title', 'abstract', 'source_url', 'year',
            'reference_count', 'publication_venue', 'venue',
            'citation_count', 'influential_citation_count',
            'fields_of_study', 'journal', 'authors',
            'overall_similarity', 'embedding_model',
            'most_relevant_sentence', 'similarity_score',
            'entailment_model', 'agree', 'disagree', 'neutral'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(document, field, data[field])
        
        document.save()
        return JsonResponse({
            'status': 'success',
            'document': document_to_dict(document)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def deleteFullDocument(request: HttpRequest, document_id: str) -> HttpResponse:
    """Delete document."""
    try:
        document = get_object_or_404(Document, document_id=document_id)
        document.delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listDocuments(request: HttpRequest) -> HttpResponse:
    """Get all documents for the current user."""
    try:
        documents = Document.objects.filter(user=request.user)
        return JsonResponse({
            'status': 'success',
            'documents': [document_to_dict(doc) for doc in documents]
        })
    except Exception as e:
        print(f"Error in listDocuments: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)