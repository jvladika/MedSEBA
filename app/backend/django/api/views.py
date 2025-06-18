from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.http import JsonResponse
import json

from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import UserSerializer, NoteSerializer, SearchHistorySerializer, ProjectSerializer, SearchResultsSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note, CustomUser, SearchHistory, DailyQuestionCount, Project, SearchResults
from rest_framework.views import APIView
from datetime import date, timedelta
from django.db.models import Max 
from django.utils import timezone



class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

# view for creating a new Note
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    # only authenticated (with valid JWT token) users can call this route
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # gives us the correct user because we are authenticated
        user = self.request.user
        return Note.objects.filter(author=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)


class NoteDelete(generics.DestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # gives us the correct user because we are authenticated
        user = self.request.user
        return Note.objects.filter(author=user)


# createAPIView will automatically handle creating a new user or object
class CreateUserView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer
    # this gives us all the objects to be looking at when we're creating a new one
    # to make sure we dont create a user that already exists
    #queryset = User.objects.all()
    # the data we need to accept to make a new user (in this case a username and a password)
    #serializer_class = UserSerializer
    # EVERYONE is allowed to create a new user
    #permission_classes = [AllowAny]

# ListCreateAPIView - handles GET (inherits from ListModelMixin) and POST (inherits from CreateModelMixin) requests
class SearchHistoryView(generics.ListCreateAPIView):
    """
    API endpoint for search history.
    Supports:
    - GET: List all search history entries for current user
    - POST: Create a new search history entry
    """
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """GET: Returns all search history entries for authenticated user"""
        return SearchHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """POST: Creates a new search history entry"""
        max_order = SearchHistory.objects.filter(
            user=self.request.user
        ).aggregate(Max('display_order'))['display_order__max'] or 0

        # SearchHistory.objects.filter(
        #     user=self.request.user
        # ).update(display_order=('display_order') - 1)

        serializer.save(
            user=self.request.user,
            display_order=max_order + 1
        )


class MoveSearchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, search_history_id):
        try:
            search_history = SearchHistory.objects.get(
                id=search_history_id,
                user=request.user
            )
            
            project_id = request.data.get('project_id')
            
            if project_id:
                # Ensure project exists and belongs to user
                project = Project.objects.get(id=project_id, user=request.user)
                search_history.project = project
                search_history.project_added_at = timezone.now()
            else:
                # Move back to search history
                search_history.project = None
                search_history.project_added_at = None

                max_order = SearchHistory.objects.filter(
                    user=request.user
                ).aggregate(Max('display_order'))['display_order__max'] or 0
                search_history.display_order = max_order + 1
                
            search_history.save()
            
            serializer = SearchHistorySerializer(search_history)
            return Response(serializer.data)
            
        except SearchHistory.DoesNotExist:
            return Response(
                {"error": "Search history entry not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found or does not belong to the user."},
                status=status.HTTP_404_NOT_FOUND
    )


class ProjectQueriesView(generics.ListAPIView):
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return SearchHistory.objects.filter(
            user=self.request.user,
            project_id=project_id
        )

class SearchHistoryListView(generics.ListAPIView):
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return non-archived search history items
        return SearchHistory.objects.filter(
            user=self.request.user,
            project__isnull=True
        )

class SearchHistoryUpdateView(generics.UpdateAPIView):
    # Required by DRF to convert database objects to JSON
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Update titel if provided
        if 'custom_title' in request.data:
            instance.custom_title = request.data['custom_title']

        # Move to front of list
        max_order = SearchHistory.objects.filter(user=request.user).aggregate(Max('display_order'))['display_order__max'] or 0
        instance.display_order = max_order + 1

        #instance.custom_title = request.data.get('title', instance.query_text)
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class SearchHistoryDeleteView(generics.DestroyAPIView):
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        try: 
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({'status': 'success'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        max_order = Project.objects.filter(
            user=self.request.user
        ).aggregate(Max('display_order'))['display_order__max'] or 0

        serializer.save(
            user=self.request.user,
            display_order=max_order + 1
        )

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)
    
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class IncrementQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            user.number_questions += 1
            user.save()
            return Response({
                "message": "Question count incremented successfully",
                "number_questions": user.number_questions
            }, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class DailyQuestionCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)

        # Fetch data for the last 30 days
        data = DailyQuestionCount.objects.filter(
            user=user,
            date__range=[thirty_days_ago, today]
        ).order_by("date")

        # Return data as a list of objects with date and count
        response_data = [
            {"date": entry.date.strftime("%Y-%m-%d"), "count": entry.count} for entry in data
        ]

        return Response(response_data)

    def post(self, request):
        user = request.user
        today = date.today()

        # Find existing entry or create a new one
        daily_count, created = DailyQuestionCount.objects.get_or_create(
            user=user,
            date=today,
            defaults={"count": 1}
        )

        if not created:
            daily_count.count += 1
            daily_count.save()

        return Response({
            "message": "Daily question count updated successfully",
            "date": daily_count.date.strftime("%Y-%m-%d"),
            "count": daily_count.count
        })

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)

        # Fetch data for the last 30 days
        data = DailyQuestionCount.objects.filter(
            user=user, 
            date__range=[thirty_days_ago, today]
        ).order_by("date")

        # Return data as a list of objects with date and count
        response_data = [
            {"date": entry.date.strftime("%Y-%m-%d"), "count": entry.count} for entry in data
        ]

        return Response(response_data)


class SearchResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('query')
        if not query:
            return Response({'error': 'Query parameter required'}, status=400)
            
        try:
            search_result = SearchResults.objects.get(
                user=request.user,
                query_text=query,
                expires_at__gt=timezone.now()
            )
            serializer = SearchResultsSerializer(search_result)
            return Response(serializer.data)
        except SearchResults.DoesNotExist:
            return Response({'error': 'No cached results found'}, status=404)

    def post(self, request):
        query = request.data.get('query')
        results = request.data.get('results')
        expires_at = request.data.get('expires_at')

        if not all([query, results, expires_at]):
            return Response({
                'error': 'Missing required fields'
            }, status=400)

        search_results, created = SearchResults.objects.update_or_create(
            user=request.user,
            query_text=query,
            defaults={
                'results': results,
                'expires_at': expires_at
            }
        )
        return Response({'success': True})
    
    def put(self, request):
    # Get query from URL parameters first, then fall back to request body
        query = request.query_params.get('query') or request.data.get('query')
        results = request.data.get('results')
        expires_at = request.data.get('expires_at')

        if not all([query, results, expires_at]):
            return Response({
                'error': 'Missing required fields'
            }, status=400)

        try:
            # First try to get the existing record
            try:
                search_result = SearchResults.objects.get(
                    user=request.user,
                    query_text=query
                )
                # Update only the results and expires_at fields
                search_result.results = results
                search_result.expires_at = expires_at
                search_result.save()
                return Response({'success': True})
            except SearchResults.DoesNotExist:
                # If not found, return 404
                return Response({'error': 'Search result not found'}, status=404)
                
        except Exception as e:
            return Response({'error': str(e)}, status=500)
