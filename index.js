const express = require("express");
const cluster = require('cluster');
const os = require('os');
const compression = require('compression');
require('dotenv').config();

const { initCatlogData } = require("./initialization");
const catlogRoute = require("./routes/catlog");
const invalidationRoute = require("./routes/invalidation");

const numCpus = os.cpus().length

const app = express();
const port = process.env.PORT || 5000;

app.use(compression());
app.use(express.json())

app.use("/jewellery", catlogRoute);
app.use("/invalidate", invalidationRoute);


if(cluster.isMaster){
  if (!global.catlogDataPrimary) initCatlogData();
  for(let i=0; i < numCpus; i++){
    const worker = cluster.fork();
    worker.send(global.catlogMain);
  }

  cluster.on('exit', function(worker, code, signal) {         
    var exitCode = worker.process.exitCode;
    console.log('worker ' + worker.process.pid + ' killed ('+exitCode+'). restarting...');
    const newWorker = cluster.fork(); 
    newWorker.send(global.catlogMain);
  });

}else{
  process.on('message', (data) => global.catlogMain = data);
  app.listen(port, () => {
    console.log(`Server running on port: ${process.env.PORT} processId: ${process.pid}`);
  });
}

module.exports = app
