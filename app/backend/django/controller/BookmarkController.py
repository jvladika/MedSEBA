import json
import logging

from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.document_models import Bookmark, Document

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listBookmarks(request: HttpRequest) -> HttpResponse:
    """Get all bookmarks for the current user."""
    try:
        bookmarks = Bookmark.objects.filter(user=request.user)
        logger.debug(f"Found {len(bookmarks)} bookmarks for user {request.user}")
        return JsonResponse({
            'status': 'success',
            'bookmarks': [{'document_id': bookmark.document.document_id} for bookmark in bookmarks]
        })
    except Exception as e:
        logger.error(f"Error in listBookmarks: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createBookmark(request: HttpRequest) -> HttpResponse:
    """Create a bookmark for a specific document and user."""
    try:
        data = json.loads(request.body)
        logger.debug(f"Request data: {data}")
        document = get_object_or_404(Document, document_id=data['document_id'])
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, document=document)
        if created:
            return JsonResponse({'status': 'success', 'bookmark_id': bookmark.bookmark_id}, status=201)
        else:
            return JsonResponse({'status': 'error', 'message': 'Bookmark already exists'}, status=400)
    except Exception as e:
        logger.error(f"Error in createBookmark: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
@permission_classes([IsAuthenticated])
def deleteBookmark(request: HttpRequest, document_id: str) -> HttpResponse:
    """Delete a bookmark by document ID."""
    try:
        bookmark = get_object_or_404(Bookmark, document__document_id=document_id)
        bookmark.delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        logger.error(f"Error in deleteBookmark: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getBookmark(request: HttpRequest, document_id: str) -> HttpResponse:
    """Retrieve a bookmark by document ID."""
    try:
        bookmark = get_object_or_404(Bookmark, user=request.user, document__document_id=document_id)
        return JsonResponse({'status': 'success', 'bookmark_id': bookmark.bookmark_id})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
