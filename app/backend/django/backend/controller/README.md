# Controllers

This directory contains the application controllers, specifying the application logic of individual endpoints.

## QueryController
Handles search and feedback operations with a base URL of `/query/`.

---

### GET `/query/<str:queryText>?alpha=0.5&numResults=5&offset=0`

Retrieves a list of query results.
optinal parameter `alpha` is the weight of vector and bm25. Alpha = 0 means pure BM25, and alpha = 1 means pure vector. Default is 0.3 \
optinal parameter `numResults` specifies the number of documents to be returned, default = 5 \
optinal parameter `offset` specifies the number of documents to be skipped on the top of the list, default = 0 \

## filters
optinal filter `publishedBefore` as maximum year of publication \
optinal filter `publishedAfter` as minimum year of publication \
optinal filter `minCitations` --not implemented yet \
optinal filter `maxCitations` --not implemented yet \
optinal filter `minRefereces` --not implemented yet \
optinal filter `maxReferences` --not implemented yet \
optinal filter `journals` --not implemented yet \

example request with all parameters and filters
```
http://127.0.0.1:8000/query/exampleQueryText?alpha=0.5&numResults=5&offset=0&minCitations=1&maxCitations=1&minRefereces=1&maxReferences=1&publishedBefore=2020&publishedAfter=1975&journals=MedLine&journals=Science%20%26%20Development&journals=Cell
```
#### Dedicated Return Codes

- `400: Failed to parse filter arguments`
- `404: No Documents found`
- `500: Internal Server Error (see server console for details)`

#### Example Response

```json
{
 [
    {
        "id": "0f5eb123-fa7b-4de4-a32b-e149d7210505", //The id of this result
        "createdAt": null,
        "documentId": "86ec290d-9718-576d-9391-116d6ad0e2ad",
        "query": "someQuery",
        "score": 0.6393443942070007
    },
    ... // More Results
 ]
}
```

---

### POST `/query/feedback/<str:queryResultId>?isPositiveFeedback=1`

Submits positive feedback for a query result.
For submitting negative feedback, isPositiveFeedback parameter can be deleted.
#### Dedicated Return Codes

- `404: QueryResult not found`
- `400: Failed to parse request body`
- `500: Internal Server Error (see server console for details)`

#### Example Response

```json
{
  "status": "success",
  "message": "Positive feedback submitted successfully."
}
```

## DocumentController
Manages document retrieval and storage with a base URL of `/document/`.

---

### GET `/document/<str:documentId>?query=someQueryText`

Retrieves the specified document.
Inlcuding the optinal parameter `query` populates the `queryRelated` field accoringly.

#### Dedicated Return Codes

- `422: Failed to parse document obtained from weaviate`
- `404: Document not found`
- `500: Internal Server Error (see server console for details)`

#### Example Response

```json
  {
    "identifier": "86ec290d-9718-576d-9391-116d6ad0e2ad",
    "externalIdentifier": "1133453",
    "source": "MedLine",
    "title": "Some Title",
    "abstract": "Some Abstract",
    "publicationDate": "1975-01-01T00:00:00Z",
    "citedBy": [],
    "references": [],
    "embeddingModel": "pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT",
    "queryRelated": { //Optional, only provided if 'query' parameter was given in request body
        "agreeableness": { //Always a valid probability distribution
            "entailmentModel": "ctu-aic/xlm-roberta-large-squad2-ctkfacts",
            "agree": 0.5530200488865376,
            "disagree": 0.44697995111346245,
            "neural": null
        },
        "relevantSection": {
            "embeddingModel": "pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT",
            "mostRelevantSentence": "Some Sentence within the Abstract.",
            "similarityScore": 0.5530200488865376
        }
    },
    "vector": null
}
```

---

### POST `/document/storeDocument/`

Stores a new document.

#### Dedicated Return Codes

- `500 Internal Server Error (Details are is returned directly, since this is only supposed to be accessiable locally)`

#### Example Response

"Document imported to Weaviate successfully."

---

### Utility Endpoints

#### GET `/document/index`

Provides the current Weaviate schema.

---

#### GET `/document/listSchemas/`

Lists all schemas registered in Weaviate.

---

#### GET `/document/countDocument/`

Counts all objects of type 'Document' in Weaviate.

---

#### GET `/document/createWeaviateClass/`

Creates a new document class schema in Weaviate.
Or Updates the document class if it doesn't have referenceCount,citationCount,journal data.

---

## OpenAIController
Manages openai related functions with a base URL of `/openai/`.

---

### GET `/openai/summarize`
Returns the summary of given abstracts as an answer to query
Requires request body to be in the form 

List[Tuple[str(id), str(abstract) , {Document.QuerySpecificData}]]

#### Example Request Body

```json
[
    [
        "3a2a882e-36f6-5434-8dc1-df97123e59b4",
        "15-Ketoprogesterone is as active as spironolactone in blocking the mineralocorticoid effect of deoxycorticosterone acetate. This activity is reduced when a methylene group is attached to the 6beta, 7beta position. The title compound was prepared from 15alpha-acetoxy-6-dehydroprogesterone. Methylenation of the delta6 double bond with dimethyloxosulfonium methylide proceeds steroselectively from the beta side of the molecule.",
        {
            "queryRelated": {
                "agreeableness": {
                    "agree": 0.02218150906264782,
                    "disagree": 0.0008273136918433011,
                    "entailmentModel": "deberta-finetuned-health",
                    "neutral": 0.9769912362098694
                },
                "query": "15-Ketoprogesterone",
                "relevantSection": {
                    "embeddingModel": "pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT",
                    "mostRelevantSentence": "15-Ketoprogesterone is as active as spironolactone in blocking the mineralocorticoid effect of deoxycorticosterone acetate.",
                    "similarityScore": 0.8744711577892303
                }
            }
        }
    ],
    [
        "36769609-39ef-5629-97f0-2bade0a5aa9d",
        "The desaturation of stearic, linoleic, and alpha-linolenic acids by human liver microsomes were studied. The microsomes were isolated from liver biopsies obtained during operation. It was shown that human liver microsomes are able to desaturate 1-14-C-alpha-linoleic acid to octadeca-6,9,12,15,-telraenoic acid: 1-15-C-linoleic acid to gammalinolenic acid; and 1-14-C-stearic acid to oleic acid in the same system described in the rat. However, the desaturation activity obtained was low compared to other mammals. This effect was attributed to fasting, pre-medication, or the anaesthesia.",
        {
            "queryRelated": {
                "agreeableness": {
                    "agree": 0.07452302426099777,
                    "disagree": 0.0059760380536317825,
                    "entailmentModel": "MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
                    "neutral": 0.9195009469985962
                },
                "query": "15-Ketoprogesterone",
                "relevantSection": {
                    "embeddingModel": "pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT",
                    "mostRelevantSentence": "The desaturation of stearic, linoleic, and alpha-linolenic acids by human liver microsomes were studied.",
                    "similarityScore": 0.6770817637443542
                }
            }
        }
    ]
]
```

#### Example Response

```json
{
    "summary": "The first abstract discusses the activity of 15-Ketoprogesterone in blocking the mineralocorticoid effect of deoxycorticosterone acetate, noting that it is as active as spironolactone in this regard. The compound was prepared from 15alpha-acetoxy-6-dehydroprogesterone, and the methylenation of the delta6 double bond with dimethyloxosulfonium methylide proceeds steroselectively from the beta side of the molecule. The second abstract focuses on the desaturation of stearic, linoleic, and alpha-linolenic acids by human liver microsomes, showing that the microsomes from liver biopsies are able to desaturate these acids, although the activity observed was low compared to other mammals, potentially due to fasting, pre-medication, or anesthesia."
}
```

---