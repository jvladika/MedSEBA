from django.contrib.auth.models import User
from rest_framework import serializers
from .document_models import Document
from .models import Note, CustomUser, SearchHistory, Project, SearchResults

# Django ORM (Object-Relational Mapping):
# - Translates Python objects to database operations
# - Allows developers to interact with databases using Python code
# - Django handles the underlying SQL queries automatically

# Serializers in Django REST Framework:
# - Convert complex data types (like Django models) to Python datatypes
# - These Python datatypes can then be easily rendered into JSON, XML, etc.
# - Also handle deserialization, allowing parsed data to be converted back into complex types

# Serializers should handle data transformation/validation
# Views should handle HTTP requests/responses and business logic
# Models should handle database structure and relationships


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        app_label = "api"
        db_table = "api_customuser"
        model = CustomUser
        # Specifies which fields to include in the serialization/deserialization process
        fields = [
            "id", 
            #"username", 
            "email", 
            "password", 
            "first_name",
            "last_name", 
            "gender", 
            "date_of_birth", 
            "number_questions"
            ]
        # Extra options for specific fields:
        # - "write_only": True for password means it can be set but not retrieved
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # Custom creation method:
        # - Uses create_user() instead of create() to properly handle password hashing
        # - **validated_data unpacks the dictionary of validated fields
        #user = User.objects.create_user(**validated_data)
        user = CustomUser.objects.create_user(
            #username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            gender=validated_data.get("gender"),
            date_of_birth=validated_data.get("date_of_birth"),
        )
        return user
    
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "author"]
        extra_kwargs = {"author": {"read_only": True}}

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__' 

class SearchHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for individual SearchHistory records.
    """
    class Meta:
        model = SearchHistory
        fields = ['id', 'query_text', 'custom_title', 'project', 'project_added_at', 'created_at', 'updated_at', 'display_order']
        read_only_fields = ['id', 'created_at', 'updated_at']

        
class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project, including nested search queries.
    """
    # ONE to MANY relationship
    search_queries = SearchHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'display_order', 'search_queries']
        read_only_fields = ['id', 'created_at', 'updated_at']

class SearchResultsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchResults
        fields = ['query_text', 'results', 'created_at', 'last_accessed', 'expires_at']
        read_only_fields = ['created_at', 'last_accessed']
