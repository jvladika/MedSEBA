from django.test import TransactionTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from api.document_models import Highlight, Document
from django.contrib.auth import get_user_model
import json

@override_settings(
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:'
        }
    }
)
class HighlightAPITest(TransactionTestCase):
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

        self.highlight = Highlight.objects.create(
            user=self.user,
            document=self.document,
            text='Sample text',
            page_number=1,
            color='yellow',
            is_crossed_out=False
        )
       
    def tearDown(self):
        Highlight.objects.all().delete()

    def test_list_highlights(self):
        response = self.client.get(reverse('highlight-list', args=[self.document.document_id]))
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content) 
        self.assertEqual(len(response_data['highlights']), 1)

    def test_create_highlight(self):
        data = {
            'document_id': self.document.document_id,
            'text': 'Test highlight',
            'page_number': 2,
            'color': 'yellow',
            'is_crossed_out': False
        }
        response = self.client.post(
            reverse('highlight-create'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Highlight.objects.count(), 2)

    def test_update_highlight(self):
        data = {
            'color': 'green'
        }
        response = self.client.put(reverse('highlight-update', args=[self.highlight.highlight_id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.highlight.refresh_from_db()
        self.assertEqual(self.highlight.color, 'green')

    def test_delete_highlight(self):
        response = self.client.delete(reverse('highlight-delete', args=[self.highlight.highlight_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Highlight.objects.count(), 0)

    def test_delete_all_highlights(self):
        response = self.client.delete(reverse('highlight-delete-all', args=[self.document.document_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Highlight.objects.count(), 0) 