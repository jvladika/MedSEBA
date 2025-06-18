#This file serves the purpose of bundleing the routes of the example controller
from django.urls import path
from ..controller import OpenAIController

urlpatterns = [
    path('summarize', OpenAIController.summarize, name='summarize'),
]