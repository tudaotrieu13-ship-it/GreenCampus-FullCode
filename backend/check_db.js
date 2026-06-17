const db = require('./src/config/db');

async function check() {
    try {
        const [items] = await db.query('SELECT id, title, price FROM items');
        console.log('Items:', items);
        
        const [msgs] = await db.query('SELECT id, content, item_id FROM messages ORDER BY id DESC LIMIT 10');
        console.log('Messages:', msgs);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
