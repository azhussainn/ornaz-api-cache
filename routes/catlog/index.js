const router = require("express").Router();
const { processCatalog } = require("./utils");


router.get("/:baseCategory?", async (req, res) => {
  const baseCategory = req.params.baseCategory;
  const allFilters = req.query;
  return res.status(200).json(processCatalog(baseCategory, allFilters));
});

module.exports = router;
