export interface UploadResult {
  metadata: {
    filename: string;
    extension: string;
    size: number;
  };
  context: {
    code?: string;
    logs?: string;
  };
}
