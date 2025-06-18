from django.urls import path
from controller import FullDocumentController
from django.http import JsonResponse

def validate_document_id(view_func):
    def wrapper(request, document_id, *args, **kwargs):
        if not document_id or document_id == 'undefined':
            return JsonResponse({
                'error': 'Invalid document ID',
                'details': 'Document ID cannot be undefined or empty'
            }, status=400)
        return view_func(request, document_id, *args, **kwargs)
    return wrapper

urlpatterns = [
    path('', FullDocumentController.listDocuments, name='document-list'),
    path('create/', FullDocumentController.storeFullDocument, name='full-document-create'),
    path('<str:document_id>/', validate_document_id(FullDocumentController.getFullDocument), name='full-document-detail'),
    path('<str:document_id>/update/', validate_document_id(FullDocumentController.updateFullDocument), name='full-document-update'),
    path('<str:document_id>/delete/', validate_document_id(FullDocumentController.deleteFullDocument), name='full-document-delete'),
    path('by-pmid/<str:pmid>/', FullDocumentController.getFullDocumentByPmid, name='full-document-pmid'),
]
