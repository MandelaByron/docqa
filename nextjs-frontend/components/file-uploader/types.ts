export type UploadStage =
  | "idle"        // nothing happening
  | "uploading"   // sending file to backend
  | "processing"  // backend parsing / indexing
  | "done"        // ready
  | "error"
 
export interface UploadedFile {
  file: File
  id: string
}
 