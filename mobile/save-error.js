const fs = require('fs');
fetch("http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=web")
  .then(r => r.json())
  .then(d => fs.writeFileSync("error.txt", d.message || JSON.stringify(d, null, 2)))
  .catch(console.error);
