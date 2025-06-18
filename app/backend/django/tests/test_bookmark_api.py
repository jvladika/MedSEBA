from django.test import TransactionTestCase
from django.urls import reverse
from api.document_models import Document, Bookmark
from django.contrib.auth import get_user_model
import json
from rest_framework.test import APIClient
from rest_framework import status

class BookmarkAPITest(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test document 
        self.document = Document.objects.create(
            user=self.user,
            pmid="12345",
            title="Test Document",
            abstract="Test Abstract",
            source_url="https://example.com",
            year=2023,
            reference_count=10,
            publication_venue={"name": "Test Venue", "type": "journal"},
            venue="Test Conference",
            citation_count=5,
            influential_citation_count=2,
            fields_of_study=["Medicine", "AI"],
            journal={"name": "Test Journal", "issn": "1234-5678"},
            authors=[{"name": "Author 1"}, {"name": "Author 2"}],
            overall_similarity=0.85,
            embedding_model="test-model",
            most_relevant_sentence="This is relevant",
            similarity_score=0.9,
            entailment_model="test-entailment",
            agree="Agreed points",
            disagree="Disagreed points",
            neutral="Neutral points"
        )

    def tearDown(self):
        Bookmark.objects.all().delete()

    def test_list_bookmarks(self):
        Bookmark.objects.create(user=self.user, document=self.document)
        response = self.client.get(reverse('bookmark-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['bookmarks']), 1)

    def test_create_bookmark(self):
        data = {"document_id": self.document.document_id}
        response = self.client.post(
            reverse('bookmark-create'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Bookmark.objects.filter(user=self.user, document=self.document).exists())

    def test_get_bookmark(self):
        Bookmark.objects.create(user=self.user, document=self.document)
        response = self.client.get(reverse('bookmark-detail', args=[self.document.document_id]))
        self.assertEqual(response.status_code, 200)

    def test_delete_bookmark(self):
        Bookmark.objects.create(user=self.user, document=self.document)
        response = self.client.delete(reverse('bookmark-delete', args=[self.document.document_id]))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Bookmark.objects.filter(user=self.user, document=self.document).exists())
