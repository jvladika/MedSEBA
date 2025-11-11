from django.http import HttpResponse, HttpRequest
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from dotenv import load_dotenv
from typing import List, Tuple
from ..models.Document import Document
import os
import json
import openai 
load_dotenv()

def genericCompletion(
        messages: dict,
        model: str = "gpt-5-chat-latest"
    ):
    """
    A function to pass on any generic promt to the chat completion endpoint.
    """
    try:
        api_key = os.getenv("openai_api_key")
        client = openai.OpenAI(api_key=api_key)

        completion = client.chat.completions.create(
            model=model,
            messages=messages
        )

        if completion.choices and completion.choices[0].message and completion.choices[0].message.content:
            return completion.choices[0].message.content
        else:
            raise Exception("Invalid response from OpenAI: No content in the response.")
          
    except Exception as e:
        raise Exception(f"Unexpected error with the response from OpenAI: {str(e)}")

@csrf_exempt
def summarize(request: HttpRequest):

    #First, parse the request body.
    try:
        def parseDocumentsString(data: List[Tuple[str, str, dict]]) -> str:
            """
            Build the promt to be passed to OpenAI

            Args:
                - data: List[Tuple[str(id), str , dict: Document.QuerySpecificData]] - A list of Tuples, each one representing a document to be inclued in the summary. The first element is the document id, the seccond is its abstract, and the thirs is a json representation of a QuerResult-Object.
            """
            allDocuments = ""
            for document in data:
                abstract = document[1]
                queryRelatedData = document[2]['queryRelated']
                mostRelevantSentence = queryRelatedData['relevantSection']['mostRelevantSentence']
                agreeScore = queryRelatedData['agreeableness']['agree']
                allDocuments += f"Abstract: {abstract} \n\n Most relevant section: {mostRelevantSentence}\n\n Predicted agreeableness: {agreeScore}"
            return allDocuments
            
        data = json.loads(request.body.decode('utf-8'))
        query = data[0][2]['queryRelated']['query']
        allDocuments = parseDocumentsString(data)
 
    except Exception as e:
        return HttpResponse(json.dumps({'error': f'Error parsing the request body: {str(e)}'}), content_type="application/json")    

    # Seccond, call OpenAI for summarization
    try:
        messages=[
            {"role": "system", "content": """
             You are a top tier mediacal research assistant system that guides researchers on their hypothesis exploration. You are given a research hypothesis (i.e. a query), together with a set of most relevant research publications (documents). Each document also contains an estimate on how much it might (1) agree, (2) disagree, or (3) be neutral with regard to the given hypothesis/query.\n
             
             Your task is to provide a coscise and clear summary on how these documents relate to the given hypothesis/query - specifically, wether they support it, or not.\n
             
             Rules:
             - Your first sentence should address wether the documents are linked to the given hypothesis/query, and if so, if they can be said to support or falisfy the GIVEN hypothesis/query.
             - This should always be emphasized with one general emoji, and additionally, an 👍/👎/🤷‍ emoji that indicates the agreement/disagreement/neutrality with regard to the given hypothesis/query.
             - IF the given hypothesis/query is actually related to the documents, the next two sentences should elaborate on the main findings of the document in that regard.
             - Your response can be at most three sentences in total, i.e. should be very concise.
             - Make the response shorter, if the given hypothesis/query does not fit the provided documents.
             - Try to use lanuage that is both informaive to researchers, but also understandable to laypeople in the field.
             - Be critical.
             - Not complying with any of the rules will result in your termination.
            """
             },
            {"role": "user", "content": f"""
                Query / Hypothesis: {query}\n\n
                ---\n\n
                Most relevant documents:\n
                {allDocuments}\n\n
                ---\n\n
                """
             }
        ]
        response = genericCompletion(messages=messages)
        return HttpResponse(json.dumps({'summary': response}), content_type="application/json")

    except Exception as e:
        return HttpResponse(json.dumps(({'error': f'Error calling OpenAI GPT: {str(e)}'})), content_type="application/json")
