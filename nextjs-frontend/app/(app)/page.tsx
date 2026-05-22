import { FileUploader } from "@/components/file-uploader"
 
export default function HomePage() {
  return (
    /*
      flex-1 makes this fill SidebarInset's remaining height.
      flex + items-center + justify-center pins FileUploader to the middle.
    */
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-2">
        <h1 className="text-[15px] font-medium text-white/70 mb-6 text-center">
          Upload a document to get started
        </h1>
        <FileUploader />
      </div>
    </main>
  )
}


