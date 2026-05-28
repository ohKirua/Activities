const presence = new Presence({
  clientId: '1509411001454559433',
})

const browsingTimestamp = Math.floor(Date.now() / 1000)

// ─────────────────────────────
// SAFE DOM HELPERS
// ─────────────────────────────
function pickText(selectors: string[]): string | undefined {
  for (const s of selectors) {
    const el = document.querySelector(s)
    const text = el?.textContent?.trim()
    if (text)
      return text
  }
  return undefined
}

function pickImg(selectors: string[]): string | undefined {
  for (const s of selectors) {
    const el = document.querySelector(s) as HTMLImageElement | null
    if (el?.src)
      return el.src
  }
  return undefined
}

// ─────────────────────────────
// AUDIO IS PRIMARY SOURCE (MOST FUTURE-PROOF)
// ─────────────────────────────
function getAudio(): HTMLAudioElement | null {
  return document.querySelector('audio')
}

function isPlaying(audio: HTMLAudioElement | null): boolean {
  return !!audio && !audio.paused && !audio.ended
}

// ─────────────────────────────
// METADATA (FALLBACK ONLY)
// ─────────────────────────────
let cachedTitle: string | undefined
let cachedArtist: string | undefined
let cachedImage: string | undefined

function updateCache() {
  cachedTitle = pickText([
    '.playbackSoundBadge__titleLink span:nth-child(2)',
    '.playbackSoundBadge__titleLink',
    '[data-testid=\'soundTitle\']',
  ]) || cachedTitle

  cachedArtist = pickText([
    '.playbackSoundBadge__lightLink',
    '[data-testid=\'soundUserLink\']',
  ]) || cachedArtist

  cachedImage = pickImg([
    '.playbackSoundBadge__avatar span.sc-artwork img',
    '.playControls__soundBadge img',
  ]) || cachedImage
}

// initial cache
updateCache()

// ─────────────────────────────
// MAIN LOOP
// ─────────────────────────────
presence.on('UpdateData', async () => {
  const audio = getAudio()
  const playing = isPlaying(audio)

  // Always refresh metadata lightly
  updateCache()

  // ── Idle / browsing state
  if (!cachedTitle && !audio) {
    presence.setActivity({
      details: 'Browsing SoundCloudv1',
      largeImageKey:
        'https://a-v2.sndcdn.com/assets/images/sc-icons/favicon-2cadd14bdb.ico',
      startTimestamp: browsingTimestamp,
    })
    return
  }

  const title = cachedTitle || 'Unknown Track'
  const artist = cachedArtist || 'Unknown Artist'

  const data: PresenceData = {
    details: title,
    state: artist,
    largeImageKey:
      cachedImage
      || 'https://a-v2.sndcdn.com/assets/images/sc-icons/favicon-2cadd14bdb.ico',
    smallImageKey: playing ? 'play' : 'pause',
    smallImageText: playing ? 'Playing' : 'Paused',
  }

  // ─────────────────────────────
  // STABLE TIMESTAMPS (ONLY IF AUDIO EXISTS)
  // ─────────────────────────────
  if (audio && playing && Number.isFinite(audio.currentTime) && Number.isFinite(audio.duration)) {
    const start = Math.floor(Date.now() / 1000 - audio.currentTime)
    const end = start + audio.duration

    data.startTimestamp = start
    data.endTimestamp = end
  }

  presence.setActivity(data)
})
