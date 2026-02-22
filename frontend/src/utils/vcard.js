import quotedPrintable from 'quoted-printable'
import utf8 from 'utf8'
import vCard from 'vcard-parser'

export function decodeQP(value, meta) {
  try {
    const encoding = meta?.encoding?.[0] || meta?.ENCODING?.[0] || ''
    const charset = meta?.charset?.[0] || meta?.CHARSET?.[0] || 'UTF-8'

    if (encoding.toUpperCase() !== 'QUOTED-PRINTABLE') return value

    const joined = value.replace(/=\r\n/g, '').replace(/=\n/g, '')
    const decoded = quotedPrintable.decode(joined)

    if (charset.toUpperCase() === 'UTF-8') {
      try {
        return utf8.decode(decoded)
      } catch {
        // Fallback si utf8.decode échoue — utilise TextDecoder natif du navigateur
        try {
          const bytes = new Uint8Array([...decoded].map(c => c.charCodeAt(0)))
          return new TextDecoder('utf-8').decode(bytes)
        } catch {
          return decoded // retourne le QP décodé sans UTF-8
        }
      }
    }
    return decoded
  } catch (e) {
    console.warn('Erreur QP decode:', e)
    return value // retourne la valeur brute originale en dernier recours
  }
}

export function getStr(card, field) {
  const prop = card[field]?.[0]
  if (!prop) return ''
  const val = Array.isArray(prop.value)
    ? prop.value.filter(Boolean).join(' ')
    : prop.value || ''
  return decodeQP(val, prop.meta)
}

export function getAll(card, field) {
  const props = card[field] || []
  return props.map(p => {
    // vCard 2.1 met le type directement comme clé sans valeur ex: {HOME: ''} 
    const type =
      p.meta?.type?.[0] ||
      p.meta?.TYPE?.[0] ||
      Object.keys(p.meta || {}).find(k =>
        ['home', 'work', 'cell', 'voice', 'fax', 'pref', 'postal', 'parcel'].includes(k.toLowerCase())
      ) ||
      field

    if (Array.isArray(p.value)) {
      // Décoder chaque partie individuellement
      return {
        type,
        value: p.value.map(part => decodeQP(part || '', p.meta)),
        raw: p.value.map(part => decodeQP(part || '', p.meta)), // ← décodé aussi
      }
    }

    return {
      type,
      value: decodeQP(p.value || '', p.meta),
      raw: typeof p.value === 'string' ? p.value.split(';') : [],
    }
  })
}

export function getPhoto(card) {
  try {
    const prop = card.photo?.[0]
    if (!prop) return null

    const value = prop.value || ''
    const meta = prop.meta || {}

    const encoding = (meta.encoding?.[0] || meta.ENCODING?.[0] || '').toLowerCase()
    const type = (meta.type?.[0] || meta.TYPE?.[0] || 'jpeg').toLowerCase()
    const valueParam = (meta.value?.[0] || meta.VALUE?.[0] || '').toLowerCase()

    if (typeof value === 'string' && value.startsWith('data:')) return value

    if (encoding === 'base64' || encoding === 'b') {
      const cleaned = value.replace(/\s+/g, '')
      if (!cleaned) return null
      const mimeType = type === 'jpg' ? 'jpeg' : type
      return `data:image/${mimeType};base64,${cleaned}`
    }

    const privateHosts = ['icloud.com', 'p18-contacts.icloud.com', 'contacts.icloud.com', 'me.com']

    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
      if (privateHosts.some(host => value.includes(host))) return null
      return value
    }

    if (valueParam === 'uri' && typeof value === 'string' && value.startsWith('http')) {
      if (privateHosts.some(host => value.includes(host))) return null
      return value
    }

    if (typeof value === 'string' && value.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(value)) {
      const cleaned = value.replace(/\s+/g, '')
      const mimeType = type === 'jpg' ? 'jpeg' : (type || 'jpeg')
      return `data:image/${mimeType};base64,${cleaned}`
    }

    return null
  } catch (e) {
    console.warn('Erreur getPhoto:', e)
    return null
  }
}

export function formatAdr(parts) {
  if (!parts) return ''
  if (!Array.isArray(parts)) return String(parts)
  // [pobox, ext, street, city, state, zip, country]
  const [, , street, city, state, zip, country] = parts
  return [street, city, state, zip, country]
    .map(p => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(', ')
}

export function splitAndParse(raw) {
  const unfolded = raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')

  const blocks = []
  const regex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi
  let match
  while ((match = regex.exec(unfolded)) !== null) {
    blocks.push(match[0])
  }

  return blocks.map((block, i) => {
    try {
      const card = vCard.parse(block)

      const nParts = (card.n?.[0]?.value || []).map(
        part => decodeQP(part || '', card.n[0].meta)
      )

      return {
        id: i,
        fn: getStr(card, 'fn') || `Contact ${i + 1}`,
        firstName: nParts[1] || '',
        lastName: nParts[0] || '',
        middleName: nParts[2] || '',
        prefix: nParts[3] || '',
        suffix: nParts[4] || '',
        org: getStr(card, 'org'),
        title: getStr(card, 'title'),
        tel: getAll(card, 'tel'),
        email: getAll(card, 'email'),
        adr: getAll(card, 'adr'),
        note: getStr(card, 'note'),
        url: getStr(card, 'url'),
        bday: getStr(card, 'bday'),
        gender: getStr(card, 'gender'),
        tz: getStr(card, 'tz'),
        photo: getPhoto(card),
      }
    } catch (e) {
      console.error(`Erreur parsing contact ${i}:`, e)
      return { id: i, fn: `Contact ${i + 1} (erreur)`, tel: [], email: [], adr: [], photo: null }
    }
  })
}