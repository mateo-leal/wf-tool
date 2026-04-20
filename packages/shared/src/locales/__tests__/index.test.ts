import { getStandardLocale, SUPPORTED_LANGUAGES } from '..'

describe('locales', () => {
  it('library locales should be supported by Intl.Collator', () => {
    const warframeLocales = Object.keys(SUPPORTED_LANGUAGES)

    const supportedLocales = Intl.Collator.supportedLocalesOf(
      warframeLocales.map(getStandardLocale)
    )
    console.log(supportedLocales)
    expect(supportedLocales.length).toBe(warframeLocales.length)
  })
})
