import { Document, determineConsensus } from "./Document";
import { Consensus } from "../../ui/components/paperTile/PaperTileConstants";

//A class representing filters to be applied locally, after fetching data from the backend.
export class LocalDocumentFilter {
  agree: boolean;
  disagree: boolean;
  neutral: boolean;

  constructor() {
    this.agree = true;
    this.disagree = true;
    this.neutral = true;
  }

  setLocalFilterFromArray(values: Consensus[]) {
    this.agree = values.includes(Consensus.agree);
    this.disagree = values.includes(Consensus.disagree);
    this.neutral = values.includes(Consensus.neutral);
  }

  applyTo(documents: Document[]): Document[] {
    return documents.filter((doc) => {
      const consensus = determineConsensus(doc.queryRelated?.agreeableness);

      return (
        (this.agree && consensus === Consensus.agree) ||
        (this.disagree && consensus === Consensus.disagree) ||
        (this.neutral && consensus === Consensus.neutral)
      );
    });
  }
}

//This class represents a filter to be sent to the backend in the /query endpoint.
export class RemoteDocumentFilter {
  publishedBefore?: number;
  publishedAfter?: number;
  minCitations?: number;
  maxCitations?: number;
  minReferences?: number;
  maxReferences?: number;
  journals?: string[];

  constructor() {
    this.publishedBefore = undefined;
    this.publishedAfter = undefined;
    this.minCitations = 0;
    this.maxCitations = undefined;
    this.minReferences = 0;
    this.maxReferences = undefined;
    this.journals = []; //Convention: Empty array means 'All journals are valid'
  }

  toQueryString(): string {
    let queryParams: string[] = [];
    if (this.publishedBefore)
      queryParams.push(`publishedBefore=${this.publishedBefore}`);
    if (this.publishedAfter)
      queryParams.push(`publishedAfter=${this.publishedAfter}`);
    if (this.minCitations && this.minCitations > 0)
      queryParams.push(`minCitations=${this.minCitations}`);
    if (this.maxCitations)
      queryParams.push(`maxCitations=${this.maxCitations}`);
    if (this.minReferences && this.minReferences > 0)
      queryParams.push(`minReferences=${this.minReferences}`);
    if (this.maxReferences)
      queryParams.push(`maxReferences=${this.maxReferences}`);
    if (this.journals && this.journals.length > 0) {
      this.journals.forEach((journal) => {
        queryParams.push(`journals=${encodeURIComponent(journal)}`);
      });
    }

    return queryParams.join("&");
  }
}
