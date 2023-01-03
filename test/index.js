const app = require("../index.js");
let chai = require('chai');
let chaiHttp = require('chai-http');

chai.use(chaiHttp);

describe("/GET all catlog data", () => {  
  it('case 1 all data', (done) => {
    chai.request(app)
        .get('/jewellery')
        .end((err, res) => {
          done();
        });
  });

});

