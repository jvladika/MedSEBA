from django.urls import path
from ..controller import DocumentController

#ToDo: Add authentication, once we have users.
urlpatterns = [
    path('index', DocumentController.index),
    path('storeDocument/', DocumentController.store),
    path('listSchemas/', DocumentController.weaviateListSchemas),
    path('<str:documentId>', DocumentController.getDocument),
    path('createWeaviateClass/', DocumentController.createWeaviateDocumentClass),
    path('countDocument/', DocumentController.weaviateCountObjects),
]
