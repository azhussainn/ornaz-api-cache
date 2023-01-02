const fs = require("fs");

function checkCatlogDataFileStorage() {
    const data = fs.readFileSync("./catlogData.json");
    const catlogData = JSON.parse(data);
    const newProducts = {}

    Object.keys(catlogData.products).forEach((primaryKey) => {
        let newKeywords = catlogData.products[primaryKey].keywords;
        newKeywords = newKeywords.map((keyword) => {
            if(keyword.includes("price")){
                price = keyword.split("=")[1].split("-")
                return `price=${parseInt(price[0])}-${parseInt(price[1])}`
            }
            return keyword
        });
        newProducts[primaryKey] = { ...catlogData.products[primaryKey], keywords : newKeywords }
    })
    
    catlogData.products = newProducts
    let testData = JSON.stringify(catlogData);
    fs.writeFileSync("./test.json", testData);
}

checkCatlogDataFileStorage()