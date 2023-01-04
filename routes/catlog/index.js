const router = require("express").Router();
const { processCatalog } = require("./utils");

router.get("/:baseCategory?", (req, res) => {
  const baseCategory = req.params.baseCategory;
  const allFilters = req.query;
  res.status(200).json(processCatalog(baseCategory, allFilters)); 
});

module.exports = router;
