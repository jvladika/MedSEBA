from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpRequest, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from api.document_models import Highlight, Document
from django.forms.models import model_to_dict   
import json

def highlight_to_dict(highlight: Highlight) -> dict:
    """Convert Highlight model to dictionary."""
    return {
        'highlight_id': highlight.highlight_id,
        'user': highlight.user.id,
        'document': highlight.document.document_id,
        'text': highlight.text,
        'page_number': highlight.page_number,
        'color': highlight.color,
        'is_crossed_out': highlight.is_crossed_out
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listHighlights(request: HttpRequest, document_id: str) -> HttpResponse:
    """Get all highlights for a specific document."""
    highlights = Highlight.objects.filter(document__document_id=document_id)
    data = [highlight_to_dict(h) for h in highlights]
    return JsonResponse({'status': 'success', 'highlights': data})

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createHighlight(request: HttpRequest) -> HttpResponse:
    """Create a highlight for a specific document and user."""
    try:
        data = request.data
        data['user'] = request.user
        data['document'] = get_object_or_404(Document, document_id=data['document_id'])
        highlight = Highlight.objects.create(
            user=data['user'],
            document=data['document'],
            text=data['text'],
            page_number=data['page_number'],
            color=data.get('color', 'yellow'),
            is_crossed_out=data.get('is_crossed_out', False)
        )
        return JsonResponse({'status': 'success', 'highlight': highlight_to_dict(highlight)}, status=201)
    except KeyError as e:
        return JsonResponse({'status': 'error', 'message': f'Missing field: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateHighlight(request: HttpRequest, highlight_id: str) -> HttpResponse:
    """Update a highlight by its ID."""
    highlight = get_object_or_404(Highlight, highlight_id=highlight_id)
    data = request.data
    highlight.text = data.get('text', highlight.text)
    highlight.page_number = data.get('page_number', highlight.page_number)
    highlight.color = data.get('color', highlight.color)
    highlight.is_crossed_out = data.get('is_crossed_out', highlight.is_crossed_out)
    highlight.save()
    return JsonResponse({'status': 'success'})

@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteHighlight(request: HttpRequest, highlight_id: str) -> HttpResponse:
    """Delete a highlight by its ID."""
    highlight = get_object_or_404(Highlight, highlight_id=highlight_id)
    highlight.delete()
    return JsonResponse({'status': 'success'})

@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteAllHighlights(request: HttpRequest, document_id: str) -> HttpResponse:
    """Delete all highlights for a specific document."""
    Highlight.objects.filter(document__document_id=document_id).delete()
    return JsonResponse({'status': 'success'}) 