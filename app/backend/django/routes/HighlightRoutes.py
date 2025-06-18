from django.urls import path
from controller import HighlightController

urlpatterns = [
    path('', HighlightController.createHighlight, name='highlight-create'),
    path('<str:document_id>/', HighlightController.listHighlights, name='highlight-list'),
    path('<str:highlight_id>/update/', HighlightController.updateHighlight, name='highlight-update'),
    path('<str:highlight_id>/delete/', HighlightController.deleteHighlight, name='highlight-delete'),
    path('<str:document_id>/delete-all/', HighlightController.deleteAllHighlights, name='highlight-delete-all'),
]
