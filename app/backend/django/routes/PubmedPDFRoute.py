from django.urls import path
from controller import PubmedPDFController

urlpatterns = [
    path('<str:pmid>/', PubmedPDFController.fetch_pdf, name='fetch-pdf')
]