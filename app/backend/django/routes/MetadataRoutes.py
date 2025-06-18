from django.urls import path
from controller import MetadataController, CitationController
from django.http import JsonResponse

urlpatterns = [
    path('<str:pmid>/', MetadataController.get_document_metadata, name='get-document-metadata'),
    path('pubmed/<str:pmid>/', MetadataController.get_pubmed_document_metadata, name='get-pubmed-document-metadata'),
    path('citations/<str:pmid>/', CitationController.get_document_citations, name='get-document-citations'),
]
