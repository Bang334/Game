import { pool } from '../db'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function exportData() {
    try {
        console.log('\n=== STARTING DATA EXPORT ===')

        // --- FETCH GAMES ---
        console.log('Fetching games...')
        const [gamesRows] = await pool.query(`
      SELECT 
        g.game_id as id,
        g.name,
        g.description,
        g.price,
        g.release_date,
        g.image,
        g.downloads,
        g.mode,
        g.multiplayer,
        g.capacity,
        g.age_rating,
        g.link_download,
        g.average_rating as rating,
        pub.name as publisher
      FROM game g
      LEFT JOIN publisher pub ON g.publisher_id = pub.publisher_id
    `)

        const games = gamesRows as any[]

        for (const game of games) {
            // Genres
            const [genresRows] = await pool.query(`
        SELECT gen.name
        FROM game_genre gg
        JOIN genre gen ON gg.genre_id = gen.genre_id
        WHERE gg.game_id = ?
      `, [game.id])
            game.genre = (genresRows as any[]).map((g: any) => g.name)

            // Platforms
            const [platformsRows] = await pool.query(`
        SELECT p.name
        FROM game_platform gp
        JOIN platform p ON gp.platform_id = p.platform_id
        WHERE gp.game_id = ?
      `, [game.id])
            game.platform = (platformsRows as any[]).map((p: any) => p.name)

            // Languages
            const [languagesRows] = await pool.query(`
        SELECT l.name
        FROM game_language gl
        JOIN language l ON gl.language_id = l.language_id
        WHERE gl.game_id = ?
      `, [game.id])
            game.language = (languagesRows as any[]).map((l: any) => l.name)

            // Min specifications
            const [specsRows] = await pool.query(`
        SELECT cpu, gpu, ram
        FROM specification
        WHERE game_id = ? AND type = 'MIN'
        LIMIT 1
      `, [game.id])

            if ((specsRows as any[]).length > 0) {
                const spec = (specsRows as any[])[0]
                game.min_spec = {
                    cpu: spec.cpu || '',
                    gpu: spec.gpu || '',
                    ram: spec.ram || '0GB'
                }
            } else {
                game.min_spec = { cpu: '', gpu: '', ram: '0GB' }
            }

            // Recommended specifications
            const [recSpecsRows] = await pool.query(`
        SELECT cpu, gpu, ram
        FROM specification
        WHERE game_id = ? AND type = 'REC'
        LIMIT 1
      `, [game.id])

            if ((recSpecsRows as any[]).length > 0) {
                const spec = (recSpecsRows as any[])[0]
                game.rec_spec = {
                    cpu: spec.cpu || '',
                    gpu: spec.gpu || '',
                    ram: spec.ram || '0GB'
                }
            } else {
                game.rec_spec = { cpu: '', gpu: '', ram: '0GB' }
            }

            // Set defaults
            game.multiplayer = game.multiplayer === 1 || game.multiplayer === true
            game.capacity = game.capacity || 0
            game.age_rating = game.age_rating || 'Everyone'
            game.mode = game.mode || 'Single Player'
            game.link_download = game.link_download || ''
        }

        console.log(`✅ Fetched ${games.length} games`)

        // --- FETCH USERS ---
        console.log('Fetching users...')
        const [usersRows] = await pool.query(`
      SELECT user_id as id, username as name, email, age, gender
      FROM user
    `)
        const users = usersRows as any[]

        for (const user of users) {
            // Favorite games (from wishlist)
            const [wishlistRows] = await pool.query(`
        SELECT game_id
        FROM wishlist
        WHERE user_id = ?
      `, [user.id])
            user.favorite_games = (wishlistRows as any[]).map((w: any) => w.game_id)

            // Purchased games with ratings
            const [purchasedRows] = await pool.query(`
        SELECT p.game_id, COALESCE(r.rating, 3) as rating
        FROM purchase p
        LEFT JOIN review r ON p.user_id = r.user_id AND p.game_id = r.game_id
        WHERE p.user_id = ?
      `, [user.id])

            user.purchased_games = {}
            for (const purchase of (purchasedRows as any[])) {
                user.purchased_games[purchase.game_id.toString()] = purchase.rating
            }

            // View history
            const [viewsRows] = await pool.query(`
        SELECT game_id, SUM(view_count) as view_count
        FROM view
        WHERE user_id = ?
        GROUP BY game_id
      `, [user.id])

            user.view_history = {}
            for (const view of (viewsRows as any[])) {
                user.view_history[view.game_id.toString()] = view.view_count || 1
            }
        }

        console.log(`✅ Fetched ${users.length} users`)

        // --- SAVE TO FILE ---
        // Path relative to backend/src/scripts
        const outputPath = path.resolve(__dirname, '..', '..', '..', 'predict', 'game.json')
        const finalData = {
            games: games,
            users: users
        }

        fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8')
        console.log(`\n🎉 SUCCESS! Data exported to ${outputPath}`)

        process.exit(0)
    } catch (error) {
        console.error('❌ ERROR exporting data:', error)
        process.exit(1)
    }
}

exportData()
