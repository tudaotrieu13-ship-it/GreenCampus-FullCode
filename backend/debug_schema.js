const mysql = require('mysql2/promise');
require('dotenv').config({path: 'backend/.env'});

(async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        
        console.log('--- social_posts ---');
        const [postsCols] = await db.query('DESCRIBE social_posts');
        console.table(postsCols);
        
        console.log('--- users ---');
        const [usersCols] = await db.query('DESCRIBE users');
        console.table(usersCols);
        
        await db.end();
    } catch (err) {
        console.error(err);
    }
})();
