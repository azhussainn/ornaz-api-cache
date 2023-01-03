const router = require("express").Router();
const { getCatlogDataApi } = require("../../initialization");

router.post("/catlog/", async (req, res) => {
    console.log("===clearing cache====");
    const { accessToken } = req.body;
    if( accessToken !== process.env.CACHE_INVALIDATE_ACCESS_TOKEN){
        return res.status(401).json({ "msg": 'You are not authorized for this route.' })        
    };
    const errResponse = await getCatlogDataApi(errorCallBack=true);
    if(errResponse) return res.status(500).json(
        {msg: errResponse.error?.message || "Something went wrong!" }
    );

    return res.status(200).json({msg: "Catlog cache invalidated successfully."})
});

module.exports = router;