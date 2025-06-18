// A QueryResult represents a distinct result-item to a query for documents, making it identifiable for further processing, like giving feedback.
// W.r.t. the desired documents, a QueryResult however only contains the related id of the resp. document.

export class QueryResult extends Object {
  id?: string;
  createdAt?: Date;
  documentId: string = "";
  query?: string;
  score?: number;

  // New PubMed fields
  pmid: string = "";
  title: string = "";
  abstract: string = "";
  publicationDate: string = "";
}

export interface SearchResponse {
  results: QueryResult[];
  summary: string;
  totalResults: number;
}

export const createQuery = (data: QueryResult): QueryResult => {
  const newData = {
    ...data,
    score: data.score && data.score * 100,
    // Map PubMed fields
    pmid: data.pmid,
    title: data.title,
    abstract: data.abstract,
    publicationDate: data.publicationDate,
  };
  return Object.assign(new QueryResult(), newData);
};
