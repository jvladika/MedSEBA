from django.urls import path
from controller import DocumentController
from django.http import JsonResponse

# Add validation middleware
def validate_document_id(view_func):
    def wrapper(request, documentId, *args, **kwargs):
        if not documentId or documentId == 'undefined':
            return JsonResponse({
                'error': 'Invalid document ID',
                'details': 'Document ID cannot be undefined or empty'
            }, status=400)
        return view_func(request, documentId, *args, **kwargs)
    return wrapper

urlpatterns = [
    path('storeDocument/', DocumentController.store),
    path('<str:documentId>', validate_document_id(DocumentController.getDocument)),
]
