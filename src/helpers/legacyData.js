export function clearLegacyData(categories) {
  const prefixes = categories.map((category) => `mini-music-player:${category}`)
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index)
    if (
      key &&
      prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))
    ) {
      window.localStorage.removeItem(key)
    }
  }
}
