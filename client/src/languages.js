import languages from '../../shared/languages.json'

export { languages }

export function getLanguage(code) {
  return languages.find((language) => language.code === code) || languages[0]
}
