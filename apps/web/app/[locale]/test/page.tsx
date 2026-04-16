import { RailjackIntrinsicProvider } from '@tenno-labs/core'

export default async function Page({ params }: PageProps<'/[locale]/test'>) {
  const { locale } = await params

  const railjackIntrinsicProvider = await RailjackIntrinsicProvider.create({
    locale,
  })

  return (
    <div>
      <h1>Test page</h1>
      <p>Current locale: {locale}</p>
      <h2>Railjack Intrinsics:</h2>
      <ul>
        {railjackIntrinsicProvider.getAll().map((ri) => (
          <li key={ri.uniqueName}>{ri.name}</li>
        ))}
      </ul>
    </div>
  )
}
