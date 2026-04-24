export type MasteryCategory =
  | 'itemCompletion'
  | 'railjackIntrinsic'
  | 'drifterIntrinsic'
  | 'starchartCompletion'
  | 'starchartCompletionSP'

export type MasteryItem = {
  id: string
  name: string
  iconUrl?: string
  masteryReq?: number
  rankNumber?: number
  masteryPoints?: number
}

export type MasteryByCategory = {
  itemCompletion: Record<string, MasteryItem[]>
  railjackIntrinsic: Record<string, MasteryItem[]>
  drifterIntrinsic: Record<string, MasteryItem[]>
  starchartCompletion: Record<string, MasteryItem[]>
  starchartCompletionSP: Record<string, MasteryItem[]>
}

export type MasterySubcategoryLabels = Record<
  MasteryCategory,
  Record<string, string>
>

export type MasteryData = MasteryByCategory & {
  subcategoryLabels: MasterySubcategoryLabels
}
