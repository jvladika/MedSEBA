from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
import json
import time

class CitationControllerTest(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Sample PubMed API response
        self.mock_pubmed_response = {
            'result': {
                '12345': {
                    'authors': [
                        {'name': 'Smith, John'},
                        {'name': 'Doe, Jane'},
                        {'name': 'Brown, Robert'}
                    ],
                    'title': 'Test Article Title',
                    'fulljournalname': 'Journal of Testing',
                    'pubdate': '2023 Jan',
                    'volume': '10',
                    'issue': '2',
                    'pages': '123-145',
                    'doi': '10.1234/test.12345',
                    'uid': '12345'
                }
            }
        }

    @patch('requests.get')
    def test_get_document_citations_success(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: self.mock_pubmed_response
        )
        
        response = self.client.get(reverse('get-document-citations', args=['12345']))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check all citation formats are present
        self.assertIn('bibtex', response.data)
        self.assertIn('mla', response.data)
        self.assertIn('apa', response.data)
        
        # Verify BibTeX format
        bibtex = response.data['bibtex']
        self.assertIn('@article{12345,', bibtex)
        self.assertIn('author = {Smith, John and Doe, Jane and Brown, Robert}', bibtex)
        self.assertIn('title = {Test Article Title}', bibtex)
        self.assertIn('journal = {Journal of Testing}', bibtex)
        self.assertIn('year = {2023}', bibtex)
        self.assertIn('volume = {10}', bibtex)
        self.assertIn('number = {2}', bibtex)
        self.assertIn('pages = {123-145}', bibtex)
        self.assertIn('doi = {10.1234/test.12345}', bibtex)
        
        # Verify MLA format
        mla = response.data['mla']
        self.assertIn('Smith, John, et al.', mla)
        self.assertIn('Test Article Title', mla)
        self.assertIn('Journal of Testing', mla)
        self.assertIn('vol. 10', mla)
        self.assertIn('no. 2', mla)
        self.assertIn('2023', mla)
        self.assertIn('pp. 123-145', mla)
        
        # Verify APA format
        apa = response.data['apa']
        self.assertIn('Smith, John, Doe, Jane, & Brown, Robert', apa)
        self.assertIn('(2023)', apa)
        self.assertIn('Test Article Title', apa)
        self.assertIn('Journal of Testing', apa)
        self.assertIn('10(2)', apa)
        self.assertIn('123-145', apa)

    @patch('requests.get')
    def test_get_document_citations_not_found(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {'result': {}}
        )
        
        response = self.client.get(reverse('get-document-citations', args=['99999']))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('requests.get')
    def test_pubmed_api_error(self, mock_get):
        mock_get.return_value = MagicMock(status_code=500)
        
        response = self.client.get(reverse('get-document-citations', args=['12345']))
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

