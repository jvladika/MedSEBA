from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpRequest, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.document_models import Comment, Document
import json

def comment_to_dict(comment: Comment) -> dict:
    """Convert Comment model to dictionary."""
    return {
        'comment_id': comment.comment_id,
        'user': comment.user.id,
        'document': comment.document.document_id,
        'line_number': comment.line_number,
        'comment_text': comment.comment_text
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listComments(request: HttpRequest, document_id: str) -> HttpResponse:
    """Get all comments for a specific document."""
    comments = Comment.objects.filter(document__document_id=document_id)
    data = [comment_to_dict(c) for c in comments]
    return JsonResponse({'status': 'success', 'comments': data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createComment(request: HttpRequest) -> HttpResponse:
    """Create a comment for a specific document and user."""
    try:
        data = request.data
        data['user'] = request.user
        data['document'] = get_object_or_404(Document, document_id=data['document_id'])
        comment = Comment.objects.create(
            user=data['user'],
            document=data['document'],
            comment_text=data['comment_text'],
            line_number=data['line_number']
        )
        return JsonResponse({'status': 'success', 'comment': comment_to_dict(comment)}, status=201)
    except KeyError as e:
        return JsonResponse({'status': 'error', 'message': f'Missing field: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateComment(request: HttpRequest, comment_id: str) -> HttpResponse:
    """Update a comment by its ID."""
    comment = get_object_or_404(Comment, comment_id=comment_id)
    data = request.data
    comment.comment_text = data.get('comment_text', comment.comment_text)
    comment.line_number = data.get('line_number', comment.line_number)
    comment.save()
    return JsonResponse({'status': 'success'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteComment(request: HttpRequest, comment_id: str) -> HttpResponse:
    """Delete a comment by its ID."""
    comment = get_object_or_404(Comment, comment_id=comment_id)
    comment.delete()
    return JsonResponse({'status': 'success'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteAllComments(request: HttpRequest, document_id: str) -> HttpResponse:
    """Delete all comments for a specific document."""
    Comment.objects.filter(document__document_id=document_id).delete()
    return JsonResponse({'status': 'success'}) 