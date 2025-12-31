const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your admin password: ', (password) => {
  bcrypt.hash(password, 10).then(hash => {
    console.log('\n✅ Password hash generated!');
    console.log('\nAdd this to your .env.local file:');
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log('\n⚠️  Remember: Your password is:', password);
    rl.close();
  });
});

