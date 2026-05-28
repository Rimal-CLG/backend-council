export interface FilePatch {
  path: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  reason: string;
  before?: string;
  after: string;
}

export interface PatchResult {
  repositoryId: string;
  summary: string;
  files: FilePatch[];
}
