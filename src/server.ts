const express = require("express");
const path = require("path");
import main_rebuild from './server/index'
import fs from 'fs';
const app = express();


// From here: https://dev.to/dcodeyt/building-a-single-page-app-without-frameworks-hl9
/* Ensure any requests prefixed with /static will serve our "frontend/static" directory */
console.log(path.resolve(__dirname,  "client"))
app.use("/client", express.static(path.resolve(__dirname,  "client")));

/* Redirect all routes to our (soon to exist) "index.html" file */
app.get("/", (req: any, res: any) => {
    res.sendFile(path.resolve("src/client", "index.html"));
});

app.get("/index.html", (req: any, res: any) => {
    res.sendFile(path.resolve("src/client", "index.html"));
});

app.get("/data",(req: any, res: any) => {
    const data = fs.readFileSync(path.resolve('all_pages.json'))
    console.log("server data", data)
    res.send(data);
});

app.post("/rebuild",async (req: any, res: any) => {
    await main_rebuild()
    res.send("done");
});

app.listen(process.env.PORT || 3000, () => console.log("Server running..."));