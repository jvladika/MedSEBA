#This file serves the purpose of bundleing the routes of the example controller
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from controller import OpenAIController

urlpatterns = [
   #path('summarize', OpenAIController.summarize, name='summarize'),
    path('document-summary', 
         csrf_exempt(OpenAIController.get_summary), 
         name='document_summary'),
   path('document-summaries', 
        csrf_exempt(OpenAIController.get_document_summaries), 
        name='document_summaries'),
     path('agreeableness', csrf_exempt(OpenAIController.get_agreeableness), name='agreeableness'),
path('query-keywords', csrf_exempt(OpenAIController.extract_query_keywords), name='query_keywords'),
        path('query-keywords', csrf_exempt(OpenAIController.extract_query_keywords), name='query_keywords'),
    path('medical-keywords', csrf_exempt(OpenAIController.extract_medical_keywords), name='medical_keywords'),

]