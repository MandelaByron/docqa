import { Chat } from "@/components/chat-page"
import { loadMessages } from "@/util/chat-store";
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function ChatPage(props: { params: Promise<{ chatID: string }> }) {
  const { chatID } = await props.params;
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) redirect("/")

  const messages = await loadMessages(chatID, token)
  return (

    <main className="flex flex-1 flex-col min-h-0">
      <Chat chatId={chatID} initialMessages={messages}/>
    </main>
  )
}

