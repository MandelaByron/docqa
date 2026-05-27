import { Chat } from "@/components/chat-page"
import { loadMessages, loadChat } from "@/util/chat-store";
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
//import { PdfViewer } from "@/components/pdf-viewer"
import { ChatWithPdf } from "@/components/chat-with-pdf"
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

  return (
    <ChatWithPdf
      chatId={chatID}
      chatTitle={chat.title}
      initialMessages={messages}
      fileUrl={chat.file_url}
    />
  )
}

