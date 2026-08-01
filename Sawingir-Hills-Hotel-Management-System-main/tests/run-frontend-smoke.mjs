import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (filePath) => fs.readFileSync(path.join(root, filePath), 'utf8');

function check(name, run) {
  run();
  console.log(`PASS ${name}`);
}

try {
  const loginSource = read('app/pages/Login.tsx');
  const dashboardSource = read('app/pages/Dashboard.tsx');
  const bookingSource = read('app/pages/Booking.tsx');
  const arrivalListSource = read('app/pages/ArrivalList.tsx');
  const checkoutListSource = read('app/pages/CheckoutList.tsx');
  const restaurantPosSource = read('app/pages/RestaurantPOS.tsx');
  const kitchenDisplaySource = read('app/pages/KitchenDisplay.tsx');
  const restaurantBackOfficeSource = read('app/pages/RestaurantBackOffice.tsx');
  const qrMenuSource = read('app/pages/QRMenu.tsx');
  const routesSource = read('app/routes.tsx');

  check('login page keeps the production sign-in shell', () => {
    assert.match(loginSource, /Welcome back/i);
    assert.match(loginSource, /Email or username/i);
    assert.match(loginSource, /Sign in/i);
  });

  check('dashboard keeps the live summary shell', () => {
    assert.match(dashboardSource, /Operations board/i);
    assert.match(dashboardSource, /No occupancy data available yet/i);
  });

  check('router uses lazy loading and protects the login route', () => {
    assert.match(routesSource, /lazy\(/);
    assert.match(routesSource, /path: '\/login'/);
    assert.match(routesSource, /prototypeModulesEnabled/);
  });

  check('front office screens keep real booking, arrival, and checkout markers', () => {
    assert.match(bookingSource, /Record payment/);
    assert.match(bookingSource, /Edit reservation/);
    assert.match(bookingSource, /Add another room/);
    assert.match(arrivalListSource, /Assign room and check in/i);
    assert.match(checkoutListSource, /Settle balance before checkout/i);
  });

  check('restaurant POS and kitchen screens keep live workflow markers', () => {
    assert.match(restaurantPosSource, /Send to kitchen/);
    assert.match(restaurantPosSource, /Guest receipt/);
    assert.match(kitchenDisplaySource, /Live kitchen operations board/);
    assert.match(kitchenDisplaySource, /Refresh queue/);
  });


  check('restaurant back office and QR menu keep live management markers', () => {
    assert.match(restaurantPosSource, /Hold order/);
    assert.match(restaurantPosSource, /Print KOT/);
    assert.match(restaurantBackOfficeSource, /Restaurant Back Office/);
    assert.match(restaurantBackOfficeSource, /Live restaurant settings/);
    assert.match(restaurantBackOfficeSource, /Tables are now configurable instead of hardcoded/);
    assert.match(qrMenuSource, /Live QR menu/);
    assert.match(qrMenuSource, /Browse the live hotel menu/i);
  });
  const assetsDir = path.join(root, 'dist', 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetNames = fs.readdirSync(assetsDir);
    check('production build emits split Login and Dashboard chunks', () => {
      assert.ok(assetNames.some((name) => /^Login-.*\.js$/.test(name)));
      assert.ok(assetNames.some((name) => /^Dashboard-.*\.js$/.test(name)));
    });
  }

  console.log('Passed frontend smoke checks.');
} catch (error) {
  console.error('Frontend smoke checks failed.');
  console.error(error);
  process.exit(1);
}


