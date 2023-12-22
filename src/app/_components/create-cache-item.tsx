"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export function CreateCacheItem() {
  const router = useRouter();
  const [cacheItem, setCacheItem] = useState("");
  const createCacheItem = api.post.setCacheItem.useMutation({
    onSuccess: () => {
      router.refresh();
    }
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createCacheItem.mutate({
          value: cacheItem,
          key: "test"
        })
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="text"
        placeholder="value"
        value={cacheItem}
        onChange={(e) => setCacheItem(e.target.value)}
        className="w-full rounded-full px-4 py-2 text-black"
      />
      <button
        type="submit"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
        disabled={createCacheItem.isLoading}
      >
        {createCacheItem.isLoading ? "Submitting..." : "Submit"}
      </button>
    </form>
  )
}