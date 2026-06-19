import { useMutation } from "@tanstack/react-query"
import { useApiClient } from "@/hooks/use-api-client"
import { DocumentRead } from "@/lib/types"

interface ProcessDocumentInput {
  url: string
  filename: string
  mime_type: string
}

export function useProcessDocument() {
  const api = useApiClient()

  return useMutation({
    mutationFn: (file: ProcessDocumentInput) =>
      api.post<DocumentRead>("/documents/process", file),
  })
}
