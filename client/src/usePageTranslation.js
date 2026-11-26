import { useEffect } from 'react'
import { translateInterface } from './api'

const rtlLanguages = new Set(['ks', 'sd', 'ur'])
const translatedTextCache = new Map()
const ignoredSelector = '[data-no-translate], .brand-copy strong, .chat-message, .result-details, .history-item, .farmer-switch, .plant-detail-data'

function isIgnored(element) {
  return Boolean(element?.closest(ignoredSelector))
}

export function usePageTranslation(languageCode, onError) {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return undefined

    const originalTexts = new Map()
    const translatedTexts = new Map()
    const originalAttributes = new Map()
    const translatedAttributes = new Map()
    let timer
    let running = false
    let runAgain = false
    let disposed = false

    document.documentElement.lang = languageCode
    document.documentElement.dir = rtlLanguages.has(languageCode) ? 'rtl' : 'ltr'

    function collectTargets() {
      const targets = []
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()

      while (node) {
        if (!isIgnored(node.parentElement)) {
          const current = node.nodeValue || ''
          const previousTranslation = translatedTexts.get(node)
          const original = previousTranslation !== undefined && current === previousTranslation
            ? originalTexts.get(node)
            : current
          if (original?.trim() && original.length <= 500) {
            originalTexts.set(node, original)
            targets.push({ type: 'text', node, original })
          }
        }
        node = walker.nextNode()
      }

      for (const element of root.querySelectorAll('[placeholder], [aria-label], [title], [alt]')) {
        if (isIgnored(element)) continue
        for (const attribute of ['placeholder', 'aria-label', 'title', 'alt']) {
          if (!element.hasAttribute(attribute)) continue
          let originals = originalAttributes.get(element)
          let translations = translatedAttributes.get(element)
          if (!originals) {
            originals = new Map()
            translations = new Map()
            originalAttributes.set(element, originals)
            translatedAttributes.set(element, translations)
          }
          const current = element.getAttribute(attribute) || ''
          const previousTranslation = translations.get(attribute)
          const original = previousTranslation !== undefined && current === previousTranslation
            ? originals.get(attribute)
            : current
          if (original?.trim() && original.length <= 500) {
            originals.set(attribute, original)
            targets.push({ type: 'attribute', element, attribute, original })
          }
        }
      }

      return targets
    }

    function applyCachedTranslations() {
      for (const target of collectTargets()) {
        const key = `${languageCode}\u0000${target.original}`
        const translation = translatedTextCache.get(key)
        if (!translation) continue
        if (target.type === 'text') {
          translatedTexts.set(target.node, translation)
          if (target.node.nodeValue !== translation) target.node.nodeValue = translation
        } else {
          translatedAttributes.get(target.element).set(target.attribute, translation)
          if (target.element.getAttribute(target.attribute) !== translation) {
            target.element.setAttribute(target.attribute, translation)
          }
        }
      }
    }

    async function translateCurrentPage() {
      const targets = collectTargets()
      const missing = [...new Set(targets
        .map((target) => target.original)
        .filter((text) => !translatedTextCache.has(`${languageCode}\u0000${text}`)))]

      for (let start = 0; start < missing.length; start += 40) {
        if (disposed) return
        const batch = missing.slice(start, start + 40)
        const result = await translateInterface(languageCode, batch)
        if (disposed) return
        if (result.translations.length !== batch.length) {
          throw new Error('The translation service returned an incomplete result.')
        }
        batch.forEach((text, index) => translatedTextCache.set(`${languageCode}\u0000${text}`, result.translations[index]))
      }

      if (disposed) return
      applyCachedTranslations()
      onError('')
    }

    function scheduleTranslation() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (running) {
          runAgain = true
          return
        }
        running = true
        translateCurrentPage()
          .catch((error) => {
            if (!disposed) onError(error.message)
          })
          .finally(() => {
            running = false
            if (runAgain && !disposed) {
              runAgain = false
              scheduleTranslation()
            }
          })
      }, 100)
    }

    function affectsTranslatableContent(mutation) {
      const target = mutation.target.nodeType === Node.ELEMENT_NODE
        ? mutation.target
        : mutation.target.parentElement
      if (isIgnored(target)) return false
      if (mutation.type !== 'childList') return true
      return [...mutation.addedNodes].some((node) => {
        if (node.nodeType === Node.TEXT_NODE) return Boolean(node.nodeValue?.trim())
        return node.nodeType === Node.ELEMENT_NODE && !isIgnored(node)
      })
    }

    function restoreOriginalPage() {
      for (const [node, original] of originalTexts) {
        if (node.isConnected && node.nodeValue === translatedTexts.get(node)) node.nodeValue = original
      }
      for (const [element, originals] of originalAttributes) {
        if (!element.isConnected) continue
        const translations = translatedAttributes.get(element)
        for (const [attribute, original] of originals) {
          if (element.getAttribute(attribute) === translations.get(attribute)) {
            element.setAttribute(attribute, original)
          }
        }
      }
    }

    onError('')
    if (languageCode === 'en') {
      return () => {
        disposed = true
        restoreOriginalPage()
        document.documentElement.lang = 'en'
        document.documentElement.dir = 'ltr'
      }
    }

    const observer = new MutationObserver((mutations) => {
      if (mutations.some(affectsTranslatableContent)) scheduleTranslation()
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    scheduleTranslation()

    return () => {
      disposed = true
      clearTimeout(timer)
      observer.disconnect()
      restoreOriginalPage()
      document.documentElement.lang = 'en'
      document.documentElement.dir = 'ltr'
    }
  }, [languageCode, onError])
}
