const express = require("express");
const { initCatlogData } = require('./initialization.js');
const catlogRoute = require("./routes/catlog");


const app = express();
const port = process.env.PORT || 3000;

global.catlogDataPrimary = null;
global.catlogDataSecondary = null;
global.catlogbaseCategories = null;
global.catlogkeywordsDict = null;
global.catlogkeywordsDictReverse = null;
global.sortDict = null;


app.use("/jewellery", catlogRoute);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
  if(!global.catlogDataPrimary){
    initCatlogData()
  }
});