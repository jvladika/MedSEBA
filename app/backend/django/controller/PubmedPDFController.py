from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import FileResponse
import requests
import os
from metapub import FindIt

@api_view(['GET'])
@permission_classes([AllowAny])
def fetch_pdf(request, pmid):
    """API endpoint to fetch PDF from PubMed Central."""
    try:
        finder = FindIt(pmid)
        article_url = finder.url

        if article_url:
            pdf_response = requests.get(article_url, stream=True)
            if pdf_response.status_code == 200:
                pdf_path = f"/tmp/{pmid}.pdf"
                with open(pdf_path, 'wb') as pdf_file:
                    for chunk in pdf_response.iter_content(chunk_size=8192):
                        pdf_file.write(chunk)

                return FileResponse(open(pdf_path, 'rb'), as_attachment=True, content_type='application/pdf')

            print(f"Failed to download PDF for PMID {pmid}. Status code: {pdf_response.status_code}")
            return Response({"error": "Failed to download PDF"}, status=500)

        print(f"No article found for PMID {pmid}.")
        return Response({"message": "Full text not found"}, status=404)
    except Exception as e:
        print(f"Error fetching PDF for PMID {pmid}: {e}")
        return Response({"error": str(e)}, status=500)
