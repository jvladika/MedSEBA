"""seba URL Configuration

This file serves the purpose of registering the routes of all controllers with a dedicated top-level route
These routes should be specified under /routes in a dedicated.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from controller.QueryController import queryDocuments, get_base_query_results, get_further_reads_results
from controller.OpenAIController import extract_medical_keywords
from api.views import CreateUserView, UserDetailView, SearchHistoryView, SearchHistoryUpdateView, DailyQuestionCountView
from controller.QueryController import get_relevant_sections
from api.views import CreateUserView, UserDetailView, SearchHistoryView, SearchHistoryUpdateView, SearchHistoryDeleteView, DailyQuestionCountView, SearchResultsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import UserDetailView  # Import from local views.py
from api.views import IncrementQuestionsView
from api.views import SearchResultsView
from api.views import (
    CreateUserView,
    UserDetailView,
    SearchHistoryView,
    SearchHistoryUpdateView,
    SearchHistoryDeleteView,
    SearchHistoryListView,
    DailyQuestionCountView,
    ProjectListCreateView, 
    ProjectDetailView,
    MoveSearchHistoryView,
    ProjectQueriesView,
    IncrementQuestionsView
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('query/<str:queryText>/', queryDocuments, name='query_documents'),  # Pass the function, not a string
    path('query/info/<str:queryText>', get_further_reads_results, name='query.get_further_reads_results'),
    path('document/', include('routes.DocumentRoutes')),
    path('openai/', include('routes.OpenAIRoutes')),
    # path('openai/', get_summary, name='summary'),
    # path('openai/', get_document_summaries, name='document_summaries'),
    # path('openai/', get_agreeableness, name='agreeableness'),
    path('enrich/relevant-sections', get_relevant_sections, name='relevant_sections'),
    path('openai/medical-keywords', extract_medical_keywords, name='medical_keywords'),
    # this is for being able to use dj ango built in auth system
    #path('auth/', include('django.contrib.auth.urls')),
    #path('auth/', include('user_auth.urls')),
    #path('', include('user_auth.urls')),
        # TwT 
    # when we go to this route, its going to call that view that we just created 
    # and allows us to make a new user
    path('api/user/register/', CreateUserView.as_view(), name='register'),
    # token
    path('api/token/', TokenObtainPairView.as_view(), name='get_token'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('api/user/', UserDetailView.as_view(), name='user-detail'),
    #path('api-auth/', include("rest_framework.urls")),

     ### SIDEBAR - SEARCH QUERY
    path('api/search-history/', SearchHistoryView.as_view(), name='search-history'),
    path('api/search-history/<int:pk>/', SearchHistoryUpdateView.as_view(), name='search-history-update'),
    path('api/search-history/<int:pk>/delete/', SearchHistoryDeleteView.as_view(), name='search-history-delete'),

    ### SIDEBAR - PROJECTS
    path('api/projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('api/projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),

    # Get non-archived search history
    path('api/search-history/active/', SearchHistoryListView.as_view(), name='active-search-history'),

    # Project search history endpoints
    path('api/search-history/<int:search_history_id>/move/', MoveSearchHistoryView.as_view(), name='move-search-history'),
    path('api/projects/<int:project_id>/queries/', ProjectQueriesView.as_view(), name='project-queries'),

    
    
    
    
    
    # whenever we go to something that has "api/" and it wasnt one of the ones above
    # we are going to take the remainder of the path (what comes after the slash) and forward that
    # to the file "api.urls"
    path("api/", include("api.urls")),
    
    path('api/user/increment-questions/', IncrementQuestionsView.as_view(), name='increment_questions'),
    path('api/bookmarks/', include('routes.BookmarkRoutes')),
    path('api/user/daily-questions/', DailyQuestionCountView.as_view(), name='daily_questions'),

    path('documents/', include('routes.FullDocumentRoutes')),
    path('bookmarks/', include('routes.BookmarkRoutes')),
    path('highlights/', include('routes.HighlightRoutes')),
    path('comments/', include('routes.CommentRoutes')),
    path('documents/metadata/', include('routes.MetadataRoutes')),
    path('documents/fetch-pdf/', include('routes.PubmedPDFRoute')),

    path('api/search-results/', SearchResultsView.as_view(), name='search-results'),
]
