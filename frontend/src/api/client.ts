import axios from 'axios'
import type {
  Champion,
  ChampionBuild,
  ChampionCounters,
  ChampionStats,
  MetaTop,
  RuneBuild,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

export async function fetchVersion(): Promise<string> {
  const { data } = await api.get<{ version: string }>('/version')
  return data.version
}

export async function fetchChampions(): Promise<Champion[]> {
  const { data } = await api.get<Champion[]>('/champions')
  return data
}

export async function fetchChampion(id: string): Promise<Champion> {
  const { data } = await api.get<Champion>(`/champions/${id}`)
  return data
}

export async function fetchChampionStats(
  id: string,
  role?: string,
  region?: string
): Promise<ChampionStats> {
  const { data } = await api.get<ChampionStats>(`/champions/${id}/stats`, {
    params: { role, region },
  })
  return data
}

export async function fetchChampionBuilds(
  id: string,
  role?: string,
  region?: string
): Promise<ChampionBuild> {
  const { data } = await api.get<ChampionBuild>(`/champions/${id}/builds`, {
    params: { role, region },
  })
  return data
}

export async function fetchChampionRunes(
  id: string,
  role?: string,
  region?: string
): Promise<RuneBuild> {
  const { data } = await api.get<RuneBuild>(`/champions/${id}/runes`, {
    params: { role, region },
  })
  return data
}

export async function fetchChampionCounters(
  id: string,
  role?: string,
  region?: string
): Promise<ChampionCounters> {
  const { data } = await api.get<ChampionCounters>(`/champions/${id}/counters`, {
    params: { role, region },
  })
  return data
}

export async function fetchMetaTop(region?: string): Promise<MetaTop> {
  const { data } = await api.get<MetaTop>('/meta/top', {
    params: { region },
  })
  return data
}
