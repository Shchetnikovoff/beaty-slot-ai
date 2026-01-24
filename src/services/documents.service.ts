import { api } from '@/lib/api';
import type {
  Document,
  DocumentsListParams,
  DocumentsListResponse,
  DocumentVersion,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@/types';

export const documentsService = {
  async getList(params?: DocumentsListParams): Promise<DocumentsListResponse> {
    return api.get<DocumentsListResponse, DocumentsListParams>('/v1/documents', params);
  },

  async getById(id: number): Promise<Document> {
    return api.get<Document>(`/v1/documents/${id}`);
  },

  async create(data: CreateDocumentDto): Promise<Document> {
    return api.post<Document>('/v1/documents', data);
  },

  async update(id: number, data: UpdateDocumentDto): Promise<Document> {
    return api.patch<Document>(`/v1/documents/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/v1/documents/${id}`);
  },

  async publish(id: number): Promise<Document> {
    return api.post<Document>(`/v1/documents/${id}/publish`);
  },

  async archive(id: number): Promise<Document> {
    return api.post<Document>(`/v1/documents/${id}/archive`);
  },

  async getVersions(id: number): Promise<DocumentVersion[]> {
    return api.get<DocumentVersion[]>(`/v1/documents/${id}/versions`);
  },
};
