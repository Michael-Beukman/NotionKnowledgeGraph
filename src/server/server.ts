const express = require("express");
const path = require("path");
import main_rebuild from "./index";
import fs from "fs";
const app = express();
// https://stackabuse.com/get-http-post-body-in-express-js
const bodyParser = require("body-parser");

// From here: https://dev.to/dcodeyt/building-a-single-page-app-without-frameworks-hl9

app.use("/client", express.static(path.resolve(__dirname, "../client")));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req: any, res: any) => {
  res.sendFile(path.resolve("src/client", "index.html"));
});

app.get("/index.html", (req: any, res: any) => {
  res.sendFile(path.resolve("src/client", "index.html"));
});

app.get("/data", (req: any, res: any) => {
  try {
    const data = fs.readFileSync(path.resolve("all_pages.json"));
    res.send(data);
  } catch (e) {
    res.send({ error: true, message: `The local file does not exist. Please add in space separated database ids and press 'Rebuild Cache'`});
  }
});

app.post("/rebuild", async (req: any, res: any) => {
  const ids = req.body.ids;
  console.log("Rebuilding now.");
  await main_rebuild(ids);
  res.send("done");
  try{

  }catch(e){
    res.send(`An error occurred. (${e})`)
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running..."));
