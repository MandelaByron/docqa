'use client'
// Anywhere in your Next.js app, temporarily
import { useAuth } from '@clerk/nextjs'

export function DevTokenCopier() {
  const { getToken } = useAuth()
  return (
    <button onClick={async () => {
      const token = await getToken()
      if (token){
          navigator.clipboard.writeText(token)
          console.log('Token copied')
      } else {
        console.error('Token not coppied')
      }
      
    }}>
      Copy JWT (dev only)
    </button>
  )
}