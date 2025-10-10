const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database path
const SQLITE_DB_PATH = path.join(__dirname, 'data/analytics.db');

function debugAnalytics() {
  console.log('🔍 Debug Analytics Database...');
  console.log('Database path:', SQLITE_DB_PATH);
  
  const db = new sqlite3.Database(SQLITE_DB_PATH);
  
  // Check if database exists and is accessible
  db.get('SELECT name FROM sqlite_master WHERE type="table"', (err, row) => {
    if (err) {
      console.error('❌ Database error:', err);
      return;
    }
    
    console.log('✅ Database accessible');
    
    // List all tables
    db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
      if (err) {
        console.error('❌ Error listing tables:', err);
        return;
      }
      
      console.log('📊 Tables found:', tables.map(t => t.name));
      
      // Check user_interactions
      db.get('SELECT COUNT(*) as count FROM user_interactions', (err, row) => {
        if (err) {
          console.error('❌ Error counting interactions:', err);
          return;
        }
        
        console.log('📈 Total interactions:', row.count);
        
        // Get top users manually
        const topUsersQuery = `
          SELECT 
            user_id,
            COUNT(*) as interaction_count,
            COUNT(CASE WHEN interaction_type = 'purchase' THEN 1 END) as purchase_count,
            COUNT(CASE WHEN interaction_type = 'review' THEN 1 END) as review_count,
            COUNT(CASE WHEN interaction_type = 'view' THEN 1 END) as view_count,
            COUNT(CASE WHEN interaction_type = 'wishlist' THEN 1 END) as wishlist_count,
            MAX(timestamp) as last_interaction
          FROM user_interactions
          GROUP BY user_id
          ORDER BY interaction_count DESC
          LIMIT 5
        `;
        
        db.all(topUsersQuery, [], (err, topUsers) => {
          if (err) {
            console.error('❌ Error fetching top users:', err);
            return;
          }
          
          console.log('🏆 Top users:');
          console.table(topUsers);
          
          // Check behavior patterns
          db.get('SELECT COUNT(*) as count FROM user_behavior_patterns', (err, row) => {
            if (err) {
              console.error('❌ Error counting behavior patterns:', err);
              return;
            }
            
            console.log('🧠 Total behavior patterns:', row.count);
            
            // Get behavior for first user
            if (topUsers.length > 0) {
              const firstUserId = topUsers[0].user_id;
              db.get('SELECT * FROM user_behavior_patterns WHERE user_id = ?', [firstUserId], (err, behavior) => {
                if (err) {
                  console.error('❌ Error fetching behavior:', err);
                  return;
                }
                
                console.log(`🧠 Behavior for user ${firstUserId}:`, behavior);
                
                db.close();
                console.log('✅ Debug completed');
              });
            } else {
              db.close();
              console.log('✅ Debug completed');
            }
          });
        });
      });
    });
  });
}

debugAnalytics();
