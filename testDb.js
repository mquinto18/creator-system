const pool = require("./db");

pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("DB connection failed:", err);
  else console.log("DB connected:", res.rows);
  pool.end();
});
