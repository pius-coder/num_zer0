export interface AuraStorageUploadArgs {
  data: Buffer | string;
  fileName: string;
  prefix: string;
  metadata?: Record<string, unknown>;
}

export interface AuraStorageUploadResult {
  id: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface AuraStoreArgs {
  data: Buffer | File | string;
  filename: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export interface AuraStoredFileResult {
  storageId: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface AuraStorageDriver {
  readonly name: string;
  upload(args: AuraStorageUploadArgs): Promise<AuraStorageUploadResult>;
  delete(keyOrUrl: string): Promise<void>;
}

export interface AuraStorage {
  upload(args: AuraStorageUploadArgs): Promise<AuraStorageUploadResult>;
  delete(keyOrUrl: string): Promise<void>;
  store(args: AuraStoreArgs): Promise<AuraStoredFileResult>;
  getUrl(storageId: string): Promise<string>;
  removeStoredFile(storageId: string): Promise<void>;
}
