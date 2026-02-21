"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAction } from "next-safe-action/hooks";

import {
  deleteAddressTagAction,
  upsertAddressTagAction,
} from "@/lib/actions/address-tags";

interface TagEntry {
  address: string;
  tag: string;
}

interface AddressTagsResponse {
  tags: TagEntry[];
}

export function useAddressTags(portfolioId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["address-tags", portfolioId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get<AddressTagsResponse>(
        `/api/portfolio/${portfolioId}/address-tags`,
      );
      return data.tags;
    },
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  });

  const currentTags = query.data ?? [];

  const [optimisticTags, setOptimisticTags] = useState<TagEntry[] | null>(null);

  const activeTags = optimisticTags ?? currentTags;

  const { execute: executeUpsert } = useAction(upsertAddressTagAction, {
    onExecute: ({ input }) => {
      const base = optimisticTags ?? currentTags;
      setOptimisticTags([
        ...base.filter((e) => e.address !== input.address),
        { address: input.address, tag: input.tag },
      ]);
    },
    onSuccess: ({ input }) => {
      queryClient.setQueryData<TagEntry[]>(queryKey, (old = []) => [
        ...old.filter((e) => e.address !== input.address),
        { address: input.address, tag: input.tag },
      ]);
      setOptimisticTags(null);
    },
    onError: () => setOptimisticTags(null),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { execute: executeDelete } = useAction(deleteAddressTagAction, {
    onExecute: ({ input }) => {
      const base = optimisticTags ?? currentTags;
      setOptimisticTags(base.filter((e) => e.address !== input.address));
    },
    onSuccess: ({ input }) => {
      queryClient.setQueryData<TagEntry[]>(queryKey, (old = []) =>
        old.filter((e) => e.address !== input.address),
      );
      setOptimisticTags(null);
    },
    onError: () => setOptimisticTags(null),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const tagMap: Record<string, string> = {};
  for (const entry of activeTags) {
    tagMap[entry.address] = entry.tag;
  }

  return {
    tagMap,
    isLoading: query.isLoading,
    upsertTag: (address: string, tag: string) =>
      executeUpsert({ portfolioId, address, tag }),
    deleteTag: (address: string) => executeDelete({ portfolioId, address }),
  };
}
