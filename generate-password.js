import bcrypt from 'bcrypt';

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    console.log('Password hash for admin:');
    console.log(hash);
    console.log('\nSQL command to update admin password:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@waxhands.ru';`);
});
