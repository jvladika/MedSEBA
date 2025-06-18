// src/data/services/__tests__/PubmedPDFService.integration.test.tsx

import PdfService from '../PubmedPDFService';
import { API_Endpoints, API_base_URL } from "../../constants/Endpoints";

describe('PdfService Integration Test', () => {
  let service: PdfService;

  beforeEach(() => {
    service = new PdfService();
  });

  it('should fetch PDF and verify content type', async () => {
    const pmid = '19088134';
    const callback = jest.fn();

    await service.fetchPdf(pmid, callback);

    expect(callback).toHaveBeenCalled();

    const [pdfBlob, error] = callback.mock.calls[0];

    expect(error).toBeUndefined();

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
  });
});