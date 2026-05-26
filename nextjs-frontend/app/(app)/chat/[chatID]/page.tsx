import { Chat } from "@/components/chat-page"
import { loadMessages, loadChat } from "@/util/chat-store";
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PdfViewer } from "@/components/pdf-viewer"
//import PdfViewer from "@/components/pdf-viewer";

export default async function ChatPage(props: { params: Promise<{ chatID: string }> }) {
  const { chatID } = await props.params;
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) redirect("/")

  // Fetch in parallel — no reason to wait for one before starting the other
  const [messages, chat] = await Promise.all([
    loadMessages(chatID, token),
    loadChat(chatID, token),
  ])
 
  if (!chat) redirect("/")

  console.log(messages)
  return (
    <main className="flex flex-1 min-h-0 overflow-hidden">
 
      {/* PDF viewer — left half, hidden on mobile */}
      {chat.file_url && (
        <div className="hidden md:flex w-1/2 min-h-0 flex-col">
          <PdfViewer url={chat.file_url} />
        </div>
      )}
 
      {/* Chat — right half on desktop, full width on mobile */}
      <div className={chat.file_url ? "hidden md:flex w-1/2 flex-col min-h-0" : "flex flex-1 flex-col min-h-0"}>
        <Chat chatId={chatID} initialMessages={messages} />
      </div>
 
    </main>
  )
}

