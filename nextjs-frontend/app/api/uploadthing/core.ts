import { createUploadthing, type FileRouter } from "uploadthing/next"
import { auth } from "@clerk/nextjs/server"

const f = createUploadthing()

export const ourFileRouter = {
  // "documentUploader" is the route name — you'll reference this in the component
  documentUploader: f({
    // Accept PDFs up to 32MB and common doc formats
    pdf:  { maxFileSize: "32MB", maxFileCount: 1 },
    "application/msword":                    { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB" },
    text: { maxFileSize: "4MB" },
  })
    // Runs on the server before the upload starts — good place to auth-gate
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorised")
      // Whatever you return here is available in onUploadComplete
      return { userId }
    })
    // Runs on the server after Uploadthing has stored the file
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.userId)
      console.log("File URL:", file.ufsUrl)
      // Return everything the frontend needs to POST to FastAPI
      return {
        url:       file.ufsUrl,
        name:      file.name,
        mimeType:  file.type
      }

      // Optional: persist to your DB here
      // await db.documents.create({ userId: metadata.userId, url: file.ufsUrl })

      // Whatever you return here arrives in onClientUploadComplete on the frontend
      //return { url: file.ufsUrl, name: file.name }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter