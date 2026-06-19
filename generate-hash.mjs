import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Podaj hasło do zahashowania: ', async (password) => {
  if (!password) {
    console.error('Hasło nie może być puste.');
    rl.close();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const hashB64 = Buffer.from(hash).toString('base64');
    
    console.log('\n--- SKOPIUJ PONIŻSZĄ WARTOŚĆ ---');
    console.log(hashB64);
    console.log('--------------------------------\n');
    console.log('Wklej ten hash do pliku .env jako zmienną PRACOWNIK_PASSWORD_HASH_B64');
  } catch (error) {
    console.error('Błąd podczas generowania hasha:', error);
  } finally {
    rl.close();
  }
});
