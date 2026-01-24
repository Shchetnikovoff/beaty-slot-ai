export type DocumentType = 'AGREEMENT' | 'POLICY' | 'TERMS' | 'OTHER';
export type DocumentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Document {
  id: number;
  title: string;
  type: DocumentType;
  content: string;
  version: number;
  status: DocumentStatus;
  is_required: boolean;
  salon_id: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  version: number;
  content: string;
  created_at: string;
  created_by: string;
}

export interface UserAgreement {
  id: number;
  client_id: number;
  document_id: number;
  version: number;
  accepted_at: string;
  ip_address?: string;
}

export interface DocumentsListParams {
  [key: string]: string | number | boolean | undefined;
  skip?: number;
  limit?: number;
  type?: DocumentType;
  status?: DocumentStatus;
}

export interface DocumentsListResponse {
  items: Document[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateDocumentDto {
  title: string;
  type: DocumentType;
  content: string;
  is_required: boolean;
}

export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  is_required?: boolean;
  status?: DocumentStatus;
}
