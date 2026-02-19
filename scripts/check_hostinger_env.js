require("dotenv").config();
const mysql = require("mysql2/promise");
const net = require("net");

async function checkEnv() {
  console.log("🔍 Checking Environment Configuration...\n");

  // 1. Check PORT
  const port = process.env.PORT || 3000;
  console.log(`1. PORT Configuration:`);
  console.log(`   - Current PORT: ${port}`);
  console.log(`   - Recommended for Nginx: 3000`);
  if (port != 3000) {
    console.warn(
      `   ⚠️  WARNING: Nginx is likely configured for port 3000. If you use ${port}, Nginx might fail to connect (502/503).`,
    );
  } else {
    console.log(`   ✅ PORT matches default Nginx config.`);
  }

  // 2. Check Database Connection
  console.log(`\n2. Database Connection:`);
  console.log(`   - Host: ${process.env.MYSQL_HOST}`);
  console.log(`   - User: ${process.env.MYSQL_USER}`);
  console.log(`   - Database: ${process.env.MYSQL_DATABASE}`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT || 3306,
    });
    console.log(`   ✅ Database Connection SUCCESS!`);
    await connection.end();
  } catch (err) {
    console.error(`   ❌ Database Connection FAILED:`);
    console.error(`      ${err.message}`);
    console.log(
      `   ⚠️  This will cause the application to crash or fail specific routes.`,
    );
  }

  // 3. Check JWT Secret
  console.log(`\n3. Security:`);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "secret") {
    console.warn(`   ⚠️  JWT_SECRET is weak or not set properly!`);
  } else {
    console.log(`   ✅ JWT_SECRET is set.`);
  }
}

checkEnv().catch(console.error);
