from django.http import HttpResponse, HttpRequest
from django.views.decorators.http import require_GET, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from dotenv import load_dotenv
from typing import List, Tuple
from models.Document import Document
import os
import re
import json
import openai 
load_dotenv()

from django.http import HttpResponse, HttpRequest, JsonResponse
from typing import List
from openai import AsyncOpenAI
import os
from asgiref.sync import async_to_sync
            
async def genericCompletion(messages: list) -> str: #TODO
    client = AsyncOpenAI(api_key="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")
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.5,
            max_tokens=800
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in genericCompletion: {str(e)}")
        raise Exception(f"Error generating completion: {str(e)}")

@csrf_exempt
@require_http_methods(["POST"])
def get_summary(request):
    @async_to_sync
    async def process_summary():
        data = json.loads(request.body)
        query = data.get('query')
        documents = data.get('documents', [])
        
        formatted_docs = []

        for idx, doc in enumerate(documents):
            try:
                abstract = doc.get('abstract', '')
                doc_id = str(hash(abstract))
                formatted_docs.append((doc_id, abstract))
            except Exception as e:
                print(f"Error processing document {idx + 1}: {str(e)}")
                continue

        messages = [
    {"role": "system", "content": """
    Format:
    [Answer to the question based on the documents in one sentence]
    [Grouping of documents into clear categories with a heading; one sentence summary for each category of grouped documents with references (e.g. [1])]
     
     Example output for how it should look:
     Sitting for prolonged periods is generally considered detrimental to health, particularly when combined with low levels of physical activity, as it is associated with increased risks of chronic diseases and mortality.

### Health Risks of Sitting
- **Sitting and Mortality**: Studies indicate that prolonged sitting is associated with increased all-cause and cardiovascular disease mortality, especially among those who are least active ([1], [4]).
- **Chronic Diseases**: Excessive sitting is linked to a higher risk of various chronic diseases, including type 2 diabetes and cardiovascular disease, reinforcing its status as an independent risk factor ([4], [7]).
- **Body Fat and Physical Activity**: Research shows that high levels of sitting are associated with increased body fat, particularly among inactive individuals, suggesting that physical activity levels may not fully offset the negative impacts of prolonged sitting ([5], [8]).

### Recommendations and Interventions
- **Public Health Guidelines**: International health authorities advocate for reduced sitting and increased physical activity, although the messaging may need to be tailored to individual circumstances ([2], [16]).
- **Intervention Efficacy**: Various interventions aimed at reducing sitting time in workplace settings have shown effectiveness, highlighting the importance of addressing sedentary behavior in public health initiatives ([6], [20]).

### Complexities and Considerations
- **Individual Variability**: The health impact of sitting may vary based on individual activity levels, indicating that for some individuals, particularly those who are already active, the effects of sitting may not be as pronounced ([2], [8]).
- **Need for Research**: There is a call for more consistent evidence and clearer guidelines regarding sedentary behavior, as current recommendations may not adequately reflect the complexities of sitting's health impacts ([3], [12]).
    """},

    {"role": "user", "content": f"Query: {query}\n\nDocuments:\n{parse_documents_for_summary(formatted_docs)}"}
]

        summary = await genericCompletion(messages)
       
        return {
            "summary": summary,
        }
    try:
        result = process_summary()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
    
def extract_document_summaries(text: str) -> List[str]:
    # Split by newline and remove empty strings
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    # Extract sentences after "Document X:"
    summaries = []
    for line in lines:
        if line.startswith('Document'):
            # Extract everything after the colon and strip whitespace
            summary = line.split(':', 1)[1].strip()
            summaries.append(summary)
    return summaries

@csrf_exempt
@require_http_methods(["POST"])
def get_document_summaries(request):
    @async_to_sync
    async def process_document_summaries():
        data = json.loads(request.body)
        query = data.get('query')
        documents = data.get('documents', [])
        
        formatted_docs = []
        for idx, doc in enumerate(documents):
            try:
                abstract = doc.get('abstract', '')
                doc_id = str(hash(abstract))
                formatted_docs.append((doc_id, abstract))
            except Exception as e:
                print(f"Error processing document {idx + 1}: {str(e)}")
                continue

        messages = [
            {"role": "system", "content": """
            Your task is to provide a one-sentence summary for each document specifically addressing how it relates to the given query.
            Format each summary as: "Document [X]: [One sentence summary relating to query]"
            
            Example:
            Query: What are the health effects of coffee?
            Document 1: This study demonstrates coffee's positive impact on alertness and cognitive function.
            Document 2: Research indicates coffee consumption may reduce risk of liver disease.
            """},
            {"role": "user", "content": f"Query: {query}\n\nDocuments:\n{parse_documents_for_summary(formatted_docs)}"}
        ]

        summaries = await genericCompletion(messages)
        parsed_summaries = extract_document_summaries(summaries)
        
        return {
            "documentSummaries": parsed_summaries,
        }

    try:
        result = process_document_summaries()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def parse_documents_for_summary(data: List[tuple]) -> str:
    all_documents = ""
    for idx, abstract in enumerate(data, 1):
        all_documents += f"Document {idx}:\n{abstract[1]}\n\n"
    return all_documents

def extract_agreeableness(text: str) -> List[dict]:
    """Extract percentages from OpenAI response"""
    pattern = r'Document (\d+): Yes: (\d+)%, No: (\d+)%'
    matches = re.finditer(pattern, text)
    
    results = []
    for match in matches:
        doc_num, agree, disagree = match.groups()
        results.append({
            'document': int(doc_num),
            'agree': int(agree),
            'disagree': int(disagree),
            #'neutral': int(neutral)
        })
    return results

@csrf_exempt
@require_http_methods(["POST"])
def get_agreeableness(request):
    @async_to_sync
    async def process_agreeableness():
        data = json.loads(request.body)
        query = data.get('query')
        documents = data.get('documents', [])
        document_summaries = data.get('documentSummaries', [])
        
        formatted_docs = []
        for idx, doc in enumerate(documents):
            try:
                abstract = doc.get('abstract', '')
                doc_id = str(hash(abstract))
                formatted_docs.append((doc_id, abstract))
            except Exception as e:
                print(f"Error processing document {idx + 1}: {str(e)}")
                continue

        # formatted_docs = []
        # for idx, doc in enumerate(documents):
        #     try:
        #         # Use document summary if available, fallback to abstract
        #         text = document_summaries[idx] if idx < len(document_summaries) else doc.get('abstract', '')
        #         doc_id = str(hash(text))
        #         formatted_docs.append((doc_id, text))
        #     except Exception as e:
        #         print(f"Error processing document {idx + 1}: {str(e)}")
        #         continue

        messages = [
            {"role": "system", "content": """
Step 1: Read the document carefully and assess whether it contains relevant information to answer the query.
	•	Consider whether the document directly supports a “yes” or “no” answer.
	•	If the document contains partial or unclear information, reflect that in the percentage breakdown.

Step 2: Assign confidence percentages that sum to 100%.
	•	If the document provides a strong basis for “yes,” assign a high percentage to “Yes.”
	•	If the document provides a strong basis for “no,” assign a high percentage to “No.”
	•	If the document is ambiguous or indirectly related, distribute the percentages accordingly.

Step 3: Justify your reasoning briefly in your head before finalizing percentages.

Format:
	•	Document 1: Yes: X%, No: Y%
	•	Document 2: Yes: X%, No: Y%
	•	Document 3: Yes: X%, No: Y%

➡ Example Output:
Document 1: Yes: 70%, No: 30% (Mentions related concepts but lacks direct confirmation)
Document 2: Yes: 40%, No: 60% (Provides some context, but key details are missing)
Document 3: Yes: 50%, No: 50% (Unclear; contains relevant and irrelevant points equally)
            """},
            {"role": "user", "content": f"Query: {query}\n\nDocuments:\n{parse_documents_for_summary(formatted_docs)}"}
        ]

        agreeableness_text = await genericCompletion(messages)
        results = extract_agreeableness(agreeableness_text)
        
        # Map results to document IDs
        response = {}
        for idx, result in enumerate(results):
            if idx < len(documents) and documents[idx].get('pmid'):
                response[documents[idx]['pmid']] = {
                    'agree': result['agree'],
                    'disagree': result['disagree'],
                    #'neutral': result['neutral']
                }

        return {"agreeableness": response}

    try:
        result = process_agreeableness()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def extract_query_keywords(request):
    @async_to_sync
    async def process_keywords():
        data = json.loads(request.body)
        queries = data.get('queries', [])
        
        if not queries:
            raise ValueError("No queries provided")

        formatted_queries = "\n".join(queries)

        messages = [
            {"role": "system", "content": """
            You are a keyword extractor. Your task is to identify the 10-14 most important topics or keywords related to the following queries. Make sure they are representative of the topics and not just words. Focus on topics, themes, or areas of interest. Return the keywords sorted in descending order of importance (most important first).
            
            Provide the keywords or topics in a list format:
            - Keyword/Topic 1
            - Keyword/Topic 2
            ..."""},
            {"role": "user", "content": f"Queries:\n{formatted_queries}"}
        ]

        keywords = await genericCompletion(messages)
        return {"keywords": keywords}

    try:
        result = process_keywords()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def extract_medical_keywords(request):
    try:
        data = json.loads(request.body)
        text = data.get('text', '')
        top_n = data.get('top_n', 3)

        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        messages = [
            {"role": "system", "content": f"""
            You are a medical keyword extractor and classifier. Your task is to:
            
            1. **Extract the most important medical keywords or topics** from the given text. These should include diseases, conditions, symptoms, treatments, anatomy, medical research themes, and methodologies.
            2. **Map each extracted keyword to its broader medical category** (e.g., "Thalamus" → "Neurology", "Melanoma" → "Skin Cancer").
            3. **Return only the broader categories** in a simple array format.

            Provide exactly {top_n} results in **this format**:

            ["Category 1", "Category 2", "Category 3"]

            Ensure:
            - Categories are precise (e.g., "Oncology" instead of "Cancer-related topics").
            - No additional text, explanations, or bullet points—just a raw list.
            """},
            {"role": "user", "content": f"Text:\n{text}"}
        ]


        keywords = async_to_sync(genericCompletion)(messages)
        return JsonResponse({"keywords": keywords})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)