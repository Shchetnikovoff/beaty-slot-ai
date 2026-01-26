import { api, isDemoMode } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import type {
  Document,
  DocumentsListParams,
  DocumentsListResponse,
  DocumentVersion,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@/types';

// Локальное состояние для демо
let localDocuments: Document[] = [...mockData.documents.items] as unknown as Document[];

export const documentsService = {
  async getList(params?: DocumentsListParams): Promise<DocumentsListResponse> {
    const getLocal = (): DocumentsListResponse => {
      let items = [...localDocuments];

      if (params?.type) {
        items = items.filter(d => d.type === params.type);
      }
      if (params?.status) {
        items = items.filter(d => d.status === params.status);
      }

      const skip = params?.skip || 0;
      const limit = params?.limit || 50;

      return {
        items: items.slice(skip, skip + limit) as Document[],
        total: items.length,
        skip,
        limit,
      };
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<DocumentsListResponse, DocumentsListParams>('/v1/documents', params);
    } catch {
      return getLocal();
    }
  },

  async getById(id: number): Promise<Document> {
    const getLocal = (): Document => {
      const doc = localDocuments.find(d => d.id === id);
      return (doc || localDocuments[0]) as Document;
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<Document>(`/v1/documents/${id}`);
    } catch {
      return getLocal();
    }
  },

  async create(data: CreateDocumentDto): Promise<Document> {
    const createLocal = (): Document => {
      const maxId = Math.max(...localDocuments.map(d => d.id), 0);
      const newDoc: Document = {
        id: maxId + 1,
        title: data.title,
        type: data.type,
        content: data.content,
        is_required: data.is_required,
        version: 1,
        status: 'DRAFT',
        salon_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localDocuments.push(newDoc);
      return newDoc;
    };

    if (isDemoMode()) {
      return createLocal();
    }
    try {
      return await api.post<Document>('/v1/documents', data);
    } catch {
      return createLocal();
    }
  },

  async update(id: number, data: UpdateDocumentDto): Promise<Document> {
    const updateLocal = (): Document => {
      const index = localDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        localDocuments[index] = {
          ...localDocuments[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        return localDocuments[index] as Document;
      }
      return localDocuments[0] as Document;
    };

    if (isDemoMode()) {
      return updateLocal();
    }
    try {
      return await api.patch<Document>(`/v1/documents/${id}`, data);
    } catch {
      return updateLocal();
    }
  },

  async delete(id: number): Promise<void> {
    const deleteLocal = () => {
      localDocuments = localDocuments.filter(d => d.id !== id);
    };

    if (isDemoMode()) {
      deleteLocal();
      return;
    }
    try {
      await api.delete(`/v1/documents/${id}`);
    } catch {
      deleteLocal();
    }
  },

  async publish(id: number): Promise<Document> {
    const publishLocal = (): Document => {
      const index = localDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        localDocuments[index] = {
          ...localDocuments[index],
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        };
        return localDocuments[index] as Document;
      }
      return localDocuments[0] as Document;
    };

    if (isDemoMode()) {
      return publishLocal();
    }
    try {
      return await api.post<Document>(`/v1/documents/${id}/publish`);
    } catch {
      return publishLocal();
    }
  },

  async archive(id: number): Promise<Document> {
    const archiveLocal = (): Document => {
      const index = localDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        localDocuments[index] = {
          ...localDocuments[index],
          status: 'ARCHIVED',
          updated_at: new Date().toISOString(),
        };
        return localDocuments[index] as Document;
      }
      return localDocuments[0] as Document;
    };

    if (isDemoMode()) {
      return archiveLocal();
    }
    try {
      return await api.post<Document>(`/v1/documents/${id}/archive`);
    } catch {
      return archiveLocal();
    }
  },

  async getVersions(id: number): Promise<DocumentVersion[]> {
    const getLocal = (): DocumentVersion[] => {
      const doc = localDocuments.find(d => d.id === id);
      if (doc) {
        return [
          {
            id: 1,
            document_id: id,
            version: doc.version || '1.0',
            content: doc.content,
            created_at: doc.created_at,
            created_by: 'admin',
          },
        ] as DocumentVersion[];
      }
      return [];
    };

    if (isDemoMode()) {
      return getLocal();
    }
    try {
      return await api.get<DocumentVersion[]>(`/v1/documents/${id}/versions`);
    } catch {
      return getLocal();
    }
  },
};
