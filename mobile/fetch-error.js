fetch("http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=web").then(r=>r.json()).then(d=>console.log(d.message || d)).catch(console.error);
