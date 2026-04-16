export type OracleWorldState = {
  Events: OracleWorldEvent[]
  Sorties: Sortie[]
  LiteSorties: LiteSortie[]
  VoidTraders: Array<VoidTrader>
}

export type OracleWorldEvent = {
  _id: Id
  Messages: Message[]
  Prop: string
  Community?: boolean
  Date?: OracleWorldStateDate
  Links?: Link[]
}

type Sortie = {
  _id: Id
  Activation: OracleWorldStateDate
  Expiry: OracleWorldStateDate
  Reward: string
  Seed: number
  Boss: string
  ExtraDrops: unknown[]
  Variants: Mission[]
  Twitter: boolean
}

type LiteSortie = {
  _id: Id
  Activation: OracleWorldStateDate
  Expiry: OracleWorldStateDate
  Reward: string
  Seed: number
  Boss: string
  Missions: Mission[]
}

export type VoidTrader = {
  _id: Id
  Activation: OracleWorldStateDate
  Expiry: OracleWorldStateDate
  Character: string
  Node: string
}

type Id = {
  $oid: string
}

type Message = {
  LanguageCode?: string
  Message?: string
}

type OracleWorldStateDate = {
  $date: {
    $numberLong: string
  }
}

type Link = {
  LanguageCode: string
  Link: string
}

type Mission = {
  missionType: string
  modifierType?: string
  node: string
  tileset?: string
}
