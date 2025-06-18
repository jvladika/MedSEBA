from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model

class MetadataControllerTest(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_document_metadata_success(self):
        valid_document_id = "33046106"
        response = self.client.get(reverse('get-document-metadata', args=[valid_document_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_document_metadata_failure(self):
        invalid_document_id = "99999999"
        response = self.client.get(reverse('get-document-metadata', args=[invalid_document_id]))
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_get_single_document_metadata_success(self):
        valid_pmid = "33046106"
        response = self.client.get(reverse('get-pubmed-document-metadata', args=[valid_pmid]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json() is not None)

    def test_get_single_document_metadata_failure(self):
        invalid_pmid = "99999999"
        response = self.client.get(reverse('get-pubmed-document-metadata', args=[invalid_pmid]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
