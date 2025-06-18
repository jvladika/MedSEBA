import FullDocumentService from '../FullDocumentService';
import { FullDocument } from '../../models/FullDocument';
import { HttpMethod } from '../../constants';
import { API_Endpoints, API_base_URL } from '../../constants/Endpoints';

jest.mock('../SuperService');

describe('FullDocumentService', () => {
  let service: FullDocumentService;
  let mockHandleRequest: jest.Mock;

  beforeEach(() => {
    service = new FullDocumentService();
    mockHandleRequest = jest.fn();
    service.handleRequest = mockHandleRequest;
  });

  it('should list documents', async () => {
    const mockDocuments: FullDocument[] = [
      { document_id: '123' },
      { document_id: '124' }
    ];
    mockHandleRequest.mockImplementationOnce((method, endpoint, data, callback) => {
      callback(mockDocuments);
    });

    const callback = jest.fn();
    await service.listDocuments(callback);

    expect(mockHandleRequest).toHaveBeenCalledWith(
      HttpMethod.GET,
      API_base_URL + API_Endpoints.documents.list,
      undefined,
      callback
    );
    expect(callback).toHaveBeenCalledWith(mockDocuments);
  });

  it('should get a document by id', async () => {
    const mockDocument: FullDocument = { document_id: '123' };
    mockHandleRequest.mockImplementationOnce((method, endpoint, data, callback) => {
      callback(mockDocument);
    });

    const callback = jest.fn();
    await service.getDocument('123', callback);

    expect(mockHandleRequest).toHaveBeenCalledWith(
      HttpMethod.GET,
      API_base_URL + API_Endpoints.documents.get.replace("{id}", '123'),
      undefined,
      callback
    );
    expect(callback).toHaveBeenCalledWith(mockDocument);
  });

  it('should create a document', async () => {
    const newDocument: Partial<FullDocument> = { title: 'New Document' };
    const createdDocument: FullDocument = { document_id: '124', title: 'New Document' };
    mockHandleRequest.mockImplementationOnce((method, endpoint, data, callback) => {
      callback(createdDocument);
    });

    const callback = jest.fn();
    await service.createDocument(newDocument, callback);

    expect(mockHandleRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      API_base_URL + API_Endpoints.documents.create,
      newDocument as JSON,
      callback
    );
    expect(callback).toHaveBeenCalledWith(createdDocument);
  });

  it('should update a document', async () => {
    const updates: Partial<FullDocument> = { title: 'Updated Title' };
    const updatedDocument: FullDocument = { document_id: '123', title: 'Updated Title' };
    mockHandleRequest.mockImplementationOnce((method, endpoint, data, callback) => {
      callback(updatedDocument);
    });

    const callback = jest.fn();
    await service.updateDocument('123', updates, callback);

    expect(mockHandleRequest).toHaveBeenCalledWith(
      HttpMethod.PUT,
      API_base_URL + API_Endpoints.documents.update.replace("{id}", '123'),
      updates as JSON,
      callback
    );
    expect(callback).toHaveBeenCalledWith(updatedDocument);
  });

  it('should delete a document', async () => {
    mockHandleRequest.mockImplementationOnce((method, endpoint, data, callback) => {
      callback();
    });

    const callback = jest.fn();
    await service.deleteDocument('123', callback);

    expect(mockHandleRequest).toHaveBeenCalledWith(
      HttpMethod.DELETE,
      API_base_URL + API_Endpoints.documents.delete.replace("{id}", '123'),
      undefined,
      callback
    );
    expect(callback).toHaveBeenCalled();
  });
});
