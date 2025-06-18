from django.test import TransactionTestCase, Client, override_settings
from django.urls import reverse
from api.document_models import Document
from api.models import Note
from django.contrib.auth import get_user_model
import json
from rest_framework.test import APIClient
from rest_framework import status
from django.db import transaction

@override_settings(
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:'
        }
    }
)
class FullDocumentAPITest(TransactionTestCase):
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
        Document.objects.all().delete()

    def test_list_documents(self):
        response = self.client.get(reverse('document-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['documents']), 1)

    def test_create_document(self):
        data = {
            "pmid": "67890",
            "title": "New Document",
            "abstract": "New Abstract",
            "source_url": "https://example.com/new",
            "year": 2024,
            "authors": [{"name": "New Author"}],
            "publication_venue": {"name": "New Venue", "type": "conference"},
            "journal": {"name": "New Journal", "issn": "5678-1234"}
        }
        response = self.client.post(
            reverse('full-document-create'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Document.objects.filter(pmid="67890").exists())

    def test_get_document(self):
        response = self.client.get(
            reverse('full-document-detail', args=[self.document.document_id])
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()['document']
        self.assertEqual(data['title'], "Test Document")
        self.assertEqual(data['pmid'], "12345")
        self.assertEqual(data['authors'], [{"name": "Author 1"}, {"name": "Author 2"}])
        self.assertEqual(data['publication_venue'], {"name": "Test Venue", "type": "journal"})
        self.assertEqual(data['journal'], {"name": "Test Journal", "issn": "1234-5678"})
        
    def test_update_document(self):
        data = {
            "title": "Updated Title",
            "citation_count": 15
        }
        response = self.client.put(
            reverse('full-document-update', args=[self.document.document_id]),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.document.refresh_from_db()
        self.assertEqual(self.document.title, "Updated Title")
        self.assertEqual(self.document.citation_count, 15)

    def test_delete_document(self):
        response = self.client.delete(
            reverse('full-document-delete', args=[self.document.document_id])
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Document.objects.filter(document_id=self.document.document_id).exists()) 