#This file serves the purpose of bundleing the routes of the example controller
from django.urls import path
from controller import QueryController

urlpatterns = [
    path('<str:queryText>', QueryController.queryDocuments, name='query'),
    path('feedback/<str:queryResultId>', QueryController.submitFeedback, name='query.submitFeedback'),
    path('info/<str:queryText>', QueryController.get_further_reads_results, name='query.get_further_reads_results')
]