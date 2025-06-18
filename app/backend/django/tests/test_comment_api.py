from django.test import TransactionTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from api.document_models import Comment, Document
from django.contrib.auth import get_user_model
import json

class CommentAPITest(TransactionTestCase):
    
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
        
        self.comment = Comment.objects.create(
            user=self.user,
            document=self.document,
            comment_text='Sample comment',
            line_number=1
        )
        
    def tearDown(self):
        Comment.objects.all().delete()    

    def test_list_comments(self):
        response = self.client.get(reverse('comment-list', args=[self.document.document_id]))
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(len(response_data['comments']), 1)

    def test_create_comment(self):
        data = {
            'document_id': self.document.document_id,
            'comment_text': 'Test comment',
            'line_number': 1
        }
        response = self.client.post(
            reverse('comment-create'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Comment.objects.count(), 2)

    def test_update_comment(self):
        data = {
            'comment_text': 'Updated comment',
            'line_number': 3
        }
        response = self.client.put(
            reverse('comment-update', args=[self.comment.comment_id]),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.comment_text, 'Updated comment')
        self.assertEqual(self.comment.line_number, 3)

    def test_delete_comment(self):
        response = self.client.delete(reverse('comment-delete', args=[self.comment.comment_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Comment.objects.count(), 0)

    def test_delete_all_comments(self):
        response = self.client.delete(reverse('comment-delete-all', args=[self.document.document_id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Comment.objects.count(), 0) 