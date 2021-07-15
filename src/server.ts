const express = require("express");
const path = require("path");
import main_rebuild from './server/index'
import fs from 'fs';
const app = express();
// https://stackabuse.com/get-http-post-body-in-express-js
const bodyParser = require('body-parser')

// From here: https://dev.to/dcodeyt/building-a-single-page-app-without-frameworks-hl9
/* Ensure any requests prefixed with /static will serve our "frontend/static" directory */
console.log(path.resolve(__dirname,  "client"))
app.use("/client", express.static(path.resolve(__dirname,  "client")));
app.use(bodyParser.urlencoded({ extended: true }));
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
    // console.log("Request ", req.body.ids);
    const ids = req.body.ids
    await main_rebuild(ids)
    res.send("done");
});

app.listen(process.env.PORT || 3000, () => console.log("Server running..."));