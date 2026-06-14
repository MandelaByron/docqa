import { UIMessage } from 'ai';


const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Shape of what FastAPI returns from GET /chats/{chatId}/messages
interface MessageRow {
  id: string;
  chat_id: string;
  role: string;
  status: string;
  ui_message: UIMessage;   // stored as JSONB, returned as the exact UIMessage shape
  created_at: string;
}

export async function loadMessages(chatId: string, token: string): Promise<UIMessage[]>  {
    const res = await fetch(
      `${API_URL}/chats/${chatId}/messages`,
      {
        headers: { Authorization: `Bearer ${token}` },
        // Always fetch fresh — don't cache chat history
        cache: "no-store",
      }
    )
    if (!res.ok) return []
    const rows: MessageRow[] = await res.json();
    //const rows: { ui_message: object }[] = await res.json()
    // Each row has a ui_message field containing the full UIMessage JSON
    console.log(rows)
    return rows.map((r) => r.ui_message)
  }

export async function loadChat(chatId: string, token: string) {
    const res = await fetch(`${API_URL}/chats/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json() as Promise<{ id: string; title: string; file_url: string | null }>
  }