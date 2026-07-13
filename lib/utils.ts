import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Copy text with a fallback for environments where Clipboard API is blocked. */
export function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => execCommandCopy(text))
  } else {
    execCommandCopy(text)
  }
}

function execCommandCopy(text: string) {
  const el = document.createElement("textarea")
  el.value = text
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0"
  document.body.appendChild(el)
  el.select()
  document.execCommand("copy")
  document.body.removeChild(el)
}
