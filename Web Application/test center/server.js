const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle all routes by serving index.html for SPA-like behavior
// (optional - comment out if you want strict file-based routing)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║       Test Center Server Running           ║
  ╠════════════════════════════════════════════╣
  ║  Local:   http://localhost:${PORT}            ║
  ║  Network: http://YOUR_IP:${PORT}              ║
  ╚════════════════════════════════════════════╝
  
  Press Ctrl+C to stop the server
  `);
});
