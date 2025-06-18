import CommentService from "../CommentService";
import { HttpMethod } from "../../constants";
import { API_Endpoints, API_base_URL } from "../../constants/Endpoints";

jest.mock('../SuperService');

describe("CommentService", () => {
  let commentService: CommentService;

  beforeEach(() => {
    commentService = new CommentService();
  });

  it("should list comments", async () => {
    const mockCallback = jest.fn();
    const mockData = [{ comment_id: 1, comment_text: 'test comment', line_number: 1 }];
    const document_id = 'doc1';

    commentService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.GET);
      expect(url).toBe(API_base_URL + API_Endpoints.comments.list.replace('{document_id}', document_id));
      callback(mockData);
    });

    await commentService.listComments(document_id, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it("should create a comment", async () => {
    const mockCallback = jest.fn();
    const mockData = { comment_id: 1, comment_text: 'test comment', line_number: 1 };
    const document_id = 'doc1';
    const comment_text = 'test comment';
    const line_number = 1;

    commentService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.POST);
      expect(url).toBe(API_base_URL + API_Endpoints.comments.create);
      expect(data).toEqual({ document_id, comment_text, line_number });
      callback(mockData);
    });

    await commentService.createComment(document_id, comment_text, line_number, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(mockData);
  });

  it("should update a comment", async () => {
    const mockCallback = jest.fn();
    const comment_id = 1;
    const updateData = { comment_text: 'updated comment' };

    commentService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.PUT);
      expect(url).toBe(API_base_URL + API_Endpoints.comments.update.replace('{comment_id}', comment_id.toString()));
      expect(data).toEqual(updateData);
      callback();
    });

    await commentService.updateComment(comment_id, updateData, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it("should delete a comment", async () => {
    const mockCallback = jest.fn();
    const comment_id = 1;

    commentService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.DELETE);
      expect(url).toBe(API_base_URL + API_Endpoints.comments.delete.replace('{comment_id}', comment_id.toString()));
      callback();
    });

    await commentService.deleteComment(comment_id, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it("should delete all comments", async () => {
    const mockCallback = jest.fn();
    const document_id = 'doc1';

    commentService.handleRequest = jest.fn().mockImplementationOnce((method, url, data, callback) => {
      expect(method).toBe(HttpMethod.DELETE);
      expect(url).toBe(API_base_URL + API_Endpoints.comments.deleteAll.replace('{document_id}', document_id));
      callback();
    });

    await commentService.deleteAllComments(document_id, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
}); 