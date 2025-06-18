import { Consensus } from "../../ui/components/paperTile/PaperTileConstants";

//This class represents a Document being fetched from the database
export class Document extends Object {
  pmid?: string;
  title?: string;
  abstract?: string;
  publicationDate?: string;
  relevantSection?: {
    embeddingModel: string;
    mostRelevantSentence: string;
    similarityScore: number;
  };
  similarity?: number;
  citations?: {
    total: number;
  };
  agreeableness?: {
    agree?: number;
    disagree?: number;
    neutral?: number;
  };
  citationCount?: number;
  score?: number;
  journal?: string;
  citedBy?: string[];
  references?: string[];
  embeddingModel?: string;
  queryRelated?: QueryRelatedType;
  identifier?: string;
  externalIdentifier?: string;
  referenceCount?: number;
  source?: string;

  constructor(data: Partial<Document>) {
    // Using Partial to make all properties optional for the constructor
    super();
    Object.assign(this, data);
  }
}

// A Document can have a special set of data associated to it, if it is related directly to a given query.
type QueryRelatedType = {
  agreeableness?: AgreeablenessType;
  relevantSection?: RelevantSectionType;
};

type AgreeablenessType = {
  entailmentModel?: string;
  agree: number;
  disagree: number;
  neutral: number | null;
};

type RelevantSectionType = {
  embeddingModel?: string;
  mostRelevantSentence?: string;
  similarityScore: number;
};

export function determineConsensus(
  agreeableness?: AgreeablenessType
): Consensus {
  if (!agreeableness) return Consensus.neutral;

  const { agree, disagree, neutral } = agreeableness;

  // Assuming neutral is a number and represents a score to determine consensus
  if (neutral !== null && neutral > agree && neutral > disagree) {
    return Consensus.neutral;
  } else if (agree > disagree) {
    return Consensus.agree;
  } else if (disagree > agree) {
    return Consensus.disagree;
  }

  return Consensus.neutral;
}
