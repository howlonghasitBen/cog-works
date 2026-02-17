import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

/**
 * Vite plugin: Card Mint API
 * POST /api/mint-card — adds a new card to cardData.json + creates metadata file
 */
function cardMintApi(): Plugin {
  const publicDir = path.resolve(__dirname, 'public')
  const cardDataPath = path.join(publicDir, 'data/cardData.json')
  const metadataDir = path.join(publicDir, 'data/metadata')

  return {
    name: 'card-mint-api',
    configureServer(server) {
      server.middlewares.use('/api/mint-card', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const editorData = JSON.parse(body)
            const cards: any[] = JSON.parse(fs.readFileSync(cardDataPath, 'utf-8'))

            // Build WavesCardData entry (same shape as existing cards in cardData.json)
            // In cardData.json: subtitle = move/attack name (e.g. "Fairy Magic")
            // In editor: subtitle = subtitle field, moveName = move name field
            const subtitle = editorData.subtitle || editorData.moveName || ''
            const stats = editorData.stats || {}
            const theme = editorData.theme || {}
            const manaCostArr = Array.isArray(editorData.manaCost) ? editorData.manaCost : []

            // Use theme colors for stat orbs if available, otherwise defaults
            const hpColor = editorData.colors?.hp || 'radial-gradient(circle, #dc143c, #8b0000)'
            const manaColor = manaCostArr[0]?.color || editorData.colors?.mana || 'radial-gradient(circle, #4169e1, #0000cd)'
            const critColor = editorData.colors?.crit || 'linear-gradient(135deg, gold, orange)'

            const newCard: any = {
              name: editorData.name || 'Untitled',
              subtitle,
              level: editorData.level != null ? String(editorData.level) : '1',
              image: editorData.imageData || '',
              type: editorData.type || 'Creature',
              stats: Object.keys(stats).length > 0 ? stats : null,
              flavorText: editorData.flavorText || 'A newly forged card enters the Whirlpool.',
              artist: editorData.artist || 'WHIRLPOOL',
              rarity: editorData.rarity || 'Common',
              hp: {
                value: String(stats.hp ?? '?'),
                color: hpColor,
                textColor: '#ffffff',
              },
              manaCost: manaCostArr.length > 0
                ? manaCostArr.map((mc: any) => ({
                    value: String(mc.value ?? '?'),
                    color: mc.color || manaColor,
                    textColor: mc.textColor || '#ffffff',
                  }))
                : {
                    value: String(stats.mana ?? '?'),
                    color: manaColor,
                    textColor: '#ffffff',
                  },
              crit: {
                value: String(stats.crit ?? '?'),
                color: critColor,
                textColor: '#1a1a1a',
              },
              theme: Object.keys(theme).length > 0 ? theme : undefined,
              token_id: null,
            }

            // Check for duplicate
            const exists = cards.some(c => c.name.toLowerCase() === newCard.name.toLowerCase())
            if (!exists) {
              cards.push(newCard)
              fs.writeFileSync(cardDataPath, JSON.stringify(cards, null, 2))
            }

            // Create metadata file (same format as generate-metadata.py)
            const idx = exists
              ? cards.findIndex(c => c.name.toLowerCase() === newCard.name.toLowerCase())
              : cards.length - 1

            const meta: any = {
              name: newCard.name,
              description: newCard.flavorText,
              image: newCard.image,
              external_url: 'https://howlonghasitben.github.io/cog-works/',
              attributes: [
                ...(newCard.type ? [{ trait_type: 'Type', value: newCard.type }] : []),
                ...(newCard.rarity ? [{ trait_type: 'Rarity', value: newCard.rarity }] : []),
                ...(newCard.level ? [{ trait_type: 'Level', value: newCard.level }] : []),
                ...(newCard.subtitle ? [{ trait_type: 'Move', value: newCard.subtitle }] : []),
                ...(newCard.artist ? [{ trait_type: 'Artist', value: newCard.artist }] : []),
              ],
              properties: { theme: newCard.theme },
            }

            // Add stat gradients
            for (const [key, label] of [['hp', 'HP'], ['manaCost', 'Mana Cost'], ['crit', 'Crit']] as const) {
              const stat = newCard[key]
              if (stat && !Array.isArray(stat)) {
                meta.attributes.push({ trait_type: label, value: stat.value })
                if (stat.color) meta.attributes.push({ trait_type: `${label} Gradient`, value: stat.color })
              }
            }

            // Theme section gradients
            const theme = newCard.theme || {}
            if (theme.background) meta.attributes.push({ trait_type: 'Card Background', value: theme.background })
            const sections: Record<string, string> = {
              header: 'Header', imageArea: 'Image Area', typeSection: 'Type Section',
              flavorText: 'Flavor Text', bottomSection: 'Bottom Section', stat: 'Stat', rarity: 'Rarity Badge',
            }
            for (const [k, label] of Object.entries(sections)) {
              const s = theme[k]
              if (s?.background) meta.attributes.push({ trait_type: `${label} Background`, value: s.background })
              if (s?.color) meta.attributes.push({ trait_type: `${label} Color`, value: s.color })
              if (s?.border) meta.attributes.push({ trait_type: `${label} Border`, value: s.border })
            }

            fs.mkdirSync(metadataDir, { recursive: true })
            fs.writeFileSync(path.join(metadataDir, `${idx}.json`), JSON.stringify(meta))

            // Update index.json
            const indexPath = path.join(metadataDir, 'index.json')
            let indexMap: any = {}
            try { indexMap = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) } catch {}
            const slug = newCard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            indexMap[newCard.name] = { index: idx, slug }
            fs.writeFileSync(indexPath, JSON.stringify(indexMap, null, 2))

            const metadataUri = `/data/metadata/${idx}.json`
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, index: idx, uri: metadataUri, name: newCard.name }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: e.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), cardMintApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@marketplace': path.resolve(__dirname, '../erc-1142/marketplace/src'),
    },
  },
})
