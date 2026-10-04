'use client'

import { useEffect } from 'react'
import { useDeck } from './DeckProvider'

const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const ACTIVATABLE_TAGS = new Set(['BUTTON', 'A'])
/** Keys that activate a focused button or link, so the deck must not steal them. */
const ACTIVATION_KEYS = new Set([' ', 'Spacebar', 'Enter'])

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter'])
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'])

/**
 * Global keyboard control.
 *
 * Presentation clickers send PageUp/PageDown, so those work everywhere. While a
 * text field has focus the deck keys are ignored, except for Escape, which gives
 * focus back to the deck. The scenario buttons on slide 3 are mouse-only and
 * blur themselves, so they never hold on to the keyboard.
 */
export function useDeckKeys(): void {
  const deck = useDeck()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const tag = target?.tagName ?? ''
      const isEditable = FORM_TAGS.has(tag) || target?.isContentEditable === true

      // Escape unwinds one layer at a time: a focused field, then the notes or
      // help, then the appendix (which returns to where the talk was).
      if (event.key === 'Escape') {
        if (isEditable) target?.blur()
        else if (deck.notesOpen || deck.helpOpen) deck.closeOverlays()
        else if (deck.appendixOpen) deck.closeAppendix()
        event.preventDefault()
        return
      }

      // A focused control owns its own keys.
      if (isEditable) return
      if (ACTIVATABLE_TAGS.has(tag) && ACTIVATION_KEYS.has(event.key)) return

      if (NEXT_KEYS.has(event.key)) {
        deck.next()
        event.preventDefault()
        return
      }
      if (PREV_KEYS.has(event.key)) {
        deck.prev()
        event.preventDefault()
        return
      }

      switch (event.key) {
        case 'Home':
          deck.goHome()
          break
        case 'End':
          deck.goEnd()
          break
        case 'a':
        case 'A':
          deck.toggleAppendix()
          break
        case 'f':
        case 'F':
          deck.toggleFullscreen()
          break
        case 'b':
        case 'B':
        case '.':
          deck.toggleBlackout()
          break
        case 'n':
        case 'N':
          deck.toggleNotes()
          break
        case 'p':
        case 'P':
          deck.openPresenter()
          break
        case 't':
        case 'T':
          deck.toggleTheme()
          break
        case 'h':
        case 'H':
          deck.toggleChrome()
          break
        case '?':
          deck.toggleHelp()
          break
        default: {
          const digit = Number(event.key)
          if (Number.isInteger(digit) && digit >= 1 && digit <= deck.slides.length) {
            deck.goToSlide(digit - 1)
            break
          }
          return
        }
      }
      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deck])
}
