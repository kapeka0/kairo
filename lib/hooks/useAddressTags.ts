"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import {
  deleteAddressTagAction,
  upsertAddressTagAction,
} from "@/lib/actions/address-tags";
import { useAtomValue } from "jotai";
import { activePortfolioIdAtom } from "../atoms/PortfolioAtoms";

interface TagEntry {
  address: string;
  tag: string;
}

interface AddressTagsResponse {
  tags: TagEntry[];
}

export function useAddressTags() {
  const activePortfolioId = useAtomValue(activePortfolioIdAtom);
  const queryClient = useQueryClient();
  const queryKey = ["address-tags", activePortfolioId];
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get<AddressTagsResponse>(
        `/api/portfolio/${activePortfolioId}/address-tags`,
      );
      return data.tags;
    },
    enabled: !!activePortfolioId,
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
      executeUpsert({ portfolioId: activePortfolioId!, address, tag }),
    deleteTag: (address: string) =>
      executeDelete({ portfolioId: activePortfolioId!, address }),
  };
}
