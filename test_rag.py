# test_rag.py  (run from your project root with the FastAPI server running)
import httpx
import json

BASE = "http://localhost:8000/api"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDIyMkFBQSIsImtpZCI6Imluc18zQ1V0NWJRZ3AzT0drMHNXUm1zNGRvTHluMmEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3Nzc0NjUwNjUsImlhdCI6MTc3NzQ2Mzg2NSwiaXNzIjoiaHR0cHM6Ly9yZWFsLXN0aW5rYnVnLTE0LmNsZXJrLmFjY291bnRzLmRldiIsImp0aSI6IjVjMDgzYWExYThhZGRkMmFjMTliIiwibmJmIjoxNzc3NDYzODYwLCJzdWIiOiJ1c2VyXzNEMW1DQ1NnNzBYS0RVa2VHckZmYVJZbEgwRyJ9.mXMSTlOjfXS1lPQfPfwmU1tN0xfvoX7s-rZgx_FCltoyd7N6cFtFVPZyVnOEMt5wFx2L05gVy1wL0v7amoh-yNUiObEJbW4Du-ZP3IxLWKcgET_RJqPKkrjkl55OhlUeMwAzEfAweUhV7VpCCwzfcFw_Kk7gY2W6lfIvMa5FHzQPOEq8f1_7_hxAeDtHCroL-jXRDVLviCC5LjDfUzHK2nhsyX-qqU1HlrpPDqbM_hX_xNNbglRWMaIiTbMLM0NmwMywhAxFN8uiD4IfHVYGt1fTbA-I5CPE0GwEoGoh8klO749LAzDoav_4jkP7LLGc7L2vVQMKg3r6VR8X9-bu-w"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def test_ask_stream(document_id: str, question: str):
    payload = {
        "question": question,
        "document_ids": [document_id],
    }

    print(f"\nQuestion: {question}\n{'─' * 60}")

    # stream=True tells httpx not to buffer — equivalent to curl's --no-buffer
    with httpx.stream(
        "POST",
        f"{BASE}/documents/ask",
        headers={**HEADERS, "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    ) as response:
        response.raise_for_status()

        for line in response.iter_lines():
            if not line.startswith("data: "):
                continue

            event = json.loads(line[6:])   # strip "data: " prefix

            if event["type"] == "citations":
                print(f"\n[Citations]")
                for c in event["data"]:
                    print(f"  • {c['filename']} p.{c.get('page_number')} — {c['snippet'][:80]}...")

            elif event["type"] == "delta":
                # print without newline so tokens flow inline like a real chat UI
                print(event["data"], end="", flush=True)

            elif event["type"] == "done":
                print("\n\n[Stream complete]")


if __name__ == "__main__":
    DOC_ID = "9b76cc89-6d9b-4018-889c-c0fda3964af0"
    test_ask_stream(DOC_ID, "Summarize the report in 3 bullet points.")

#ngrok http 8000 --url https://default.internal