import { spawnSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = process.cwd();
const serverDir = path.join(projectRoot, 'server');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(script) {
  const result = spawnSync(npmCommand, ['run', script], {
    cwd: serverDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Preparing Sawingir Hills demo environment...');
run('db:generate');
run('db:push');
run('db:seed');

console.log('\nDemo accounts');
console.log('- admin / Admin@123');
console.log('- dev / Dev@123');
console.log('- manager / Manager@123');
console.log('- frontoffice / FrontOffice@123');
console.log('- restaurantstaff / Restaurant@123');
console.log('\nSuggested demo flow');
console.log('1. Log in as frontoffice and show dashboard, arrivals, and checkouts.');
console.log('2. Create a booking and confirm the live availability and price calculation.');
console.log('3. Check in today\'s arrival, then check out the in-house guest.');
console.log('4. Log in as restaurantstaff and place a table order from Restaurant POS.');
console.log('5. Open Kitchen Display, move the ticket to ready, then return to POS to serve and complete it.');
console.log('6. Open Restaurant Back Office and show the live menu/category records powering the slice.');
console.log('7. Log in as dev or admin and review live users plus the updated dashboard counts.');
