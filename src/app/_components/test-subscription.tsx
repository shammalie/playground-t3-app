"use client"
import { useState } from "react"
import { api } from "~/trpc/react"

export function TestSubscriptions() {
  const [item, setItem] = useState("")
  api.post.onAdd.useSubscription(undefined, {
    onData(data) {
      setItem(data)
    },
    onError(err) {
      console.error('Subscription error:', err);
    }
  })
  return (
    <div>
      <p>websocket message: {item}</p>
    </div>
  )
}