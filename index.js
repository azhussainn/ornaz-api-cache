const express = require("express");
const compression = require('compression')
const { initCatlogData } = require("./initialization.js");
const catlogRoute = require("./routes/catlog");

const app = express();
const port = process.env.PORT || 5000;

global.catlogDataPrimary = null;
global.catlogDataSecondary = null;
global.catlogbaseCategories = null;
global.catlogkeywordsDict = null;
global.catlogkeywordsDictReverse = null;
global.sortDict = null;
global.attributesData = null;

app.use(compression());
app.use("/jewellery", catlogRoute);

app.listen(port, () => {
  console.log(`App listening on port ${process.env.PORT}`);
  if (!global.catlogDataPrimary) {
    initCatlogData();
  }
});
