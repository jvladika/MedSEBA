import HighlightService from '../HighlightService';
import { API_Endpoints, API_base_URL } from '../../constants/Endpoints';
import { HttpMethod } from '../../constants';

jest.mock('../SuperService');

describe('HighlightService', () => {
  let highlightService: HighlightService;

  beforeEach(() => {
    highlightService = new HighlightService();
  });

  it('should list highlights', async () => {
    const mockCallback = jest.fn();
    const mockData = [{ highlight_id: 1, text: 'test highlight', page_number: 1 }];
    const document_id = 'doc1';

    highlightService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.GET);
      expect(url).toBe(API_base_URL + API_Endpoints.highlights.list.replace('{document_id}', document_id));
      callback(mockData);
    });

    await highlightService.listHighlights(document_id, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it('should create a highlight', async () => {
    const mockCallback = jest.fn();
    const mockData = { highlight_id: 1, text: 'test highlight', page_number: 1 };
    const document_id = 'doc1';
    const text = 'test highlight';
    const page_number = 1;
    const color = 'yellow';
    const is_crossed_out = false;

    highlightService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.POST);
      expect(url).toBe(API_base_URL + API_Endpoints.highlights.create);
      expect(data).toEqual({ document_id, text, page_number, color, is_crossed_out });
      callback(mockData);
    });

    await highlightService.createHighlight(document_id, text, page_number, color, is_crossed_out, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it('should update a highlight', async () => {
    const mockCallback = jest.fn();
    const highlight_id = 1;
    const updateData = { color: 'blue' };

    highlightService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.PUT);
      expect(url).toBe(API_base_URL + API_Endpoints.highlights.update.replace('{highlight_id}', highlight_id.toString()));
      expect(data).toEqual(updateData);
      callback();
    });

    await highlightService.updateHighlight(highlight_id, updateData, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should delete a highlight', async () => {
    const mockCallback = jest.fn();
    const highlight_id = 1;

    highlightService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.DELETE);
      expect(url).toBe(API_base_URL + API_Endpoints.highlights.delete.replace('{highlight_id}', highlight_id.toString()));
      callback();
    });

    await highlightService.deleteHighlight(highlight_id, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should delete all highlights', async () => {
    const mockCallback = jest.fn();
    const document_id = 'doc1';

    highlightService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.DELETE);
      expect(url).toBe(API_base_URL + API_Endpoints.highlights.deleteAll.replace('{document_id}', document_id));
      callback();
    });

    await highlightService.deleteAllHighlights(document_id, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
}); 