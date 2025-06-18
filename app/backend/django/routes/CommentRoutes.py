from django.urls import path
from controller import CommentController

urlpatterns = [
    path('', CommentController.createComment, name='comment-create'),
    path('<str:document_id>/', CommentController.listComments, name='comment-list'),
    path('<str:comment_id>/update/', CommentController.updateComment, name='comment-update'),
    path('<str:comment_id>/delete/', CommentController.deleteComment, name='comment-delete'),
    path('<str:document_id>/delete-all/', CommentController.deleteAllComments, name='comment-delete-all'),
] 