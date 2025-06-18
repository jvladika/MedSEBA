from django.http import HttpResponse, HttpRequest, JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from ..mongo.models.QueryModels import QueryResult, QueryResultFeedback
from ..WeaviateWrapper import WeaviateWrapper, DocumentFilter, InvalidFilterException, DocumentNotFoundException
from ..models.Document import Document
from typing import List
import json

@require_GET
def queryDocuments(request: HttpRequest, queryText: str) -> HttpResponse:
    
    alpha = float(request.GET.get('alpha', 0.3))
    numResults = int(request.GET.get('numResults', 5))
    offset = int(request.GET.get('offset', 0))
    
    # Get filter parameters from the URL
    # TODO: Obtain referenceCount & citationsCount from Semantic-Scholar API
    filters = DocumentFilter(
        min_citations = request.GET.get('minCitations'),
        max_citations = request.GET.get('maxCitations'),
        min_references = request.GET.get('minReferences'),
        max_references = request.GET.get('maxReferences'),
        journals = request.GET.getlist('journals'),
        published_before = request.GET.get('publishedBefore'),
        published_after = request.GET.get('publishedAfter')        
    )

    try:
        wrapper = WeaviateWrapper()
        result = wrapper.searchDocuments(query = queryText, filters = filters, alpha = alpha, numResults = numResults, offset = offset) 
        
    except InvalidFilterException as e:
        return JsonResponse({'status': 'error', 'message': f"{e}"}, status=400)
    except DocumentNotFoundException as e:
        return JsonResponse({'status': 'error', 'message': f"{e}"}, status=404)
    except Exception as e:
        print(e.with_traceback())
        return JsonResponse({'status': 'error', 'message': 'Internal Server Error.'}, status=500)
     
    # Create a new QueryResponse to wrap each Document, so we can identify the response later for feedback collection.
    queryResults: List[QueryResult] = []
    for score,document in result: # we have tuple of [score,Document]
        queryResponse = QueryResult(
            documentId=document.identifier,
            query=queryText,
            score=str(score),
            alpha=str(alpha)
        )
        queryResponse.save() # Saves to database
        queryResults.append(queryResponse.toDict())

    return HttpResponse(json.dumps(queryResults), content_type="application/json")

@csrf_exempt
@require_POST
def submitFeedback(request: HttpRequest, queryResultId: str) -> JsonResponse:
    try:
        queryResult: QueryResult = QueryResult.objects.get(id=queryResultId) #Throws QueryResult.DoesNotExist 
        isPositiveFeedback: bool = request.GET.get('isPositiveFeedback', None)
    
        # Delete existing feedback, create and save new feedback
        QueryResultFeedback.objects.filter(queryResult=queryResult).delete()
        feedback: QueryResultFeedback = QueryResultFeedback(queryResult=queryResult, isPositiveFeedback=isPositiveFeedback)
        feedback.save()

        verbalized: str = "Positive" if isPositiveFeedback else "Negative"
        return JsonResponse({'status': 'success', 'message': f'{verbalized} feedback submitted successfully.'})
    
    except QueryResult.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Resource Not Found.'}, status=404)
    except (KeyError, json.JSONDecodeError, ValidationError):
        return JsonResponse({'status': 'error', 'message': 'Bad request'}, status=400)
    except Exception as e:
        print(e.with_traceback())
        return JsonResponse({'status': 'error', 'message': 'Internal Server Error.'}, status=500)
