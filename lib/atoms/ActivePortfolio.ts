import { atomWithStorage } from 'jotai/utils'

export const activePortfolioIdAtom = atomWithStorage<string | null>('activePortfolioId', null)