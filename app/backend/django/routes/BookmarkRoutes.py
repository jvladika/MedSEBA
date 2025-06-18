from django.urls import path
from controller import BookmarkController

urlpatterns = [
    path('', BookmarkController.listBookmarks, name='bookmark-list'),
    path('create/', BookmarkController.createBookmark, name='bookmark-create'),
    path('<str:document_id>/', BookmarkController.getBookmark, name='bookmark-detail'),
    path('<str:document_id>/delete/', BookmarkController.deleteBookmark, name='bookmark-delete'),
]
