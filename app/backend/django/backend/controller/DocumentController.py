from django.shortcuts import render
import json
from django.http import HttpResponse, HttpRequest, JsonResponse
from django.views.decorators.http import require_GET, require_POST
from bson.json_util import dumps,loads
from django.views.decorators.csrf import csrf_exempt
from ..models.EmbeddingModels import AbstractEmbeddingModel, sPubMedBERT, simSce
from ..WeaviateWrapper import WeaviateWrapper, DocumentNotFoundException
from ..models.Document import Document

# Create your views here.
def index(request):
    wrapper = WeaviateWrapper()
    schema = wrapper.client.data_object.get()
    return HttpResponse(dumps(schema,indent=2))

@require_GET
def getDocument(request: HttpRequest, documentId: str) -> HttpResponse:
    wrapper = WeaviateWrapper()
    try:
        query = request.GET.get('query', None)
        document = wrapper.loadDocumentFromId(documentId)
        if query: # If a query is provided, load the query-specific data
            document.loadDataSpecificTo(query)
        jsonResponseData = json.loads(document.toJSON())
        return JsonResponse(jsonResponseData, safe=False, json_dumps_params={'indent': 2})
    
    except DocumentNotFoundException as e:
        return JsonResponse({'status': 'error', 'message': e.message}, status=404)

    except (KeyError, json.JSONDecodeError):
        return JsonResponse({'status': 'error', 'message': 'Unprocessable Entity'}, status=422)

    except Exception as e:
        print(e.with_traceback())
        return JsonResponse({'status': 'error', 'message': 'Internal Server Error.'}, status=500)

def weaviateListSchemas(request):
    wrapper = WeaviateWrapper()
    schema = wrapper.client.schema.get()
    return HttpResponse(dumps(schema,indent=2))

def weaviateCountObjects(request):
    wrapper = WeaviateWrapper()
    result = wrapper.client.query.aggregate("Document").with_meta_count().do()
    print(result)
    return HttpResponse(dumps(result,indent=2))

def createWeaviateDocumentClass(request):
    wrapper = WeaviateWrapper()
    wrapper.createDocumentClass()
    return HttpResponse("Document schema created")

@csrf_exempt
def store(request):
    try:
        # Create an instance of the Document class
        document = Document(
            identifier ="",
            externalIdentifier=request.POST["externalIdentifier"],
            title=request.POST["title"],
            abstract=request.POST["abstract"],
            publicationDate=request.POST["publicationDate"],
            citedBy=request.POST.getlist("citedBy"),
            references=request.POST.getlist("references"),
            source=request.POST["source"],
            embeddingModel = "",
            citationCount=request.POST["citationCount"],
            referenceCount=request.POST["referenceCount"],
            journal=request.POST["journal"],
        )
        # Call the storeDocument function
        wrapper = WeaviateWrapper()
        wrapper.storeDocument(document=document)

        # Return a success response
        return HttpResponse("Document imported to Weaviate successfully.")
    except Exception as e:
        # Return an error response with a status code and a JSON message
        error_message = {"error": str(e)}
        return JsonResponse(error_message, status=500)  # Adjust the status code as needed




