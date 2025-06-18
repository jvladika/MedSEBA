import BookmarkService from '../BookmarkService';
import { API_Endpoints, API_base_URL } from '../../constants/Endpoints';
import { HttpMethod } from '../../constants';

jest.mock('../SuperService');

describe('BookmarkService', () => {
  let bookmarkService: BookmarkService;

  beforeEach(() => {
    bookmarkService = new BookmarkService();
  });

  it('should list bookmarks', async () => {
    const mockCallback = jest.fn();
    const mockData = [{ bookmark_id: 1, document_id: 'doc1' }];

    bookmarkService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.GET);
      expect(url).toBe(API_base_URL + API_Endpoints.bookmarks.list);
      callback(mockData);
    });

    await bookmarkService.listBookmarks(mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it('should create a bookmark', async () => {
    const mockCallback = jest.fn();
    const mockData = { bookmark_id: 1, document_id: 'doc1' };

    bookmarkService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.POST);
      expect(url).toBe(API_base_URL + API_Endpoints.bookmarks.create);
      expect(data).toEqual({ document_id: 'doc1' });
      callback(mockData);
    });

    await bookmarkService.createBookmark('doc1', mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it('should get a bookmark', async () => {
    const mockCallback = jest.fn();
    const mockData = { bookmark_id: 1, document_id: 'doc1' };

    bookmarkService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.GET);
      expect(url).toBe(API_base_URL + API_Endpoints.bookmarks.get.replace('{document_id}', 'doc1'));
      callback(mockData);
    });

    await bookmarkService.getBookmark('doc1', mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it('should delete a bookmark', async () => {
    const mockCallback = jest.fn();

    bookmarkService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.DELETE);
      expect(url).toBe(API_base_URL + API_Endpoints.bookmarks.delete.replace('{document_id}', 'doc1'));
      callback();
    });

    await bookmarkService.deleteBookmark('doc1', mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
}); 