getAllMasterData: async (req, res, next) => {
  try {
    //apply sort, search, pagination
    let search = {
      active: true,
    };
    if (!UtilController.isEmpty(req.body.keyword)) {
      search["$or"] = [
        { productName: { $regex: req.body.keyword, $options: "i" } },
        { productSku: { $regex: req.body.keyword, $options: "i" } },
        { productDescription: { $regex: req.body.keyword, $options: "i" } },
        { category: { $regex: req.body.keyword, $options: "i" } },
        { hsnCode: { $regex: req.body.keyword, $options: "i" } },
      ];
    }
    if (!UtilController.isEmpty(req.body.active))
      search["active"] = req.body.active;

    let sort = {};
    if (
      !UtilController.isEmpty(req.body.sortField) &&
      !UtilController.isEmpty(req.body.sortOrder)
    ) {
      let sortField = req.body.sortField;
      let sortOrder = req.body.sortOrder;

      sort[sortField] = sortOrder;
    } else {
      sort = { updatedAt: -1 };
    }

    let pageSize = 10;
    let page = 0;
    if (!UtilController.isEmpty(req.body.pageSize))
      pageSize = req.body.pageSize;
    if (!UtilController.isEmpty(req.body.page)) page = req.body.page;

    const inventory = await Inventory.aggregate([
      {
        $lookup: {
          from: "VehicleModel",
          localField: "primaryVehicle",
          foreignField: "_id",
          as: "primaryVehicle",
        },
      },
      {
        $lookup: {
          from: "VehicleModel",
          localField: "secondaryVehicle",
          foreignField: "_id",
          as: "secondaryVehicle",
        },
      },
      //select only required fields from user in operatedBy
      {
        $lookup: {
          from: "users",
          localField: "operatedBy",
          foreignField: "_id",
          as: "operatedByAlias",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByAlias",
        },
      },
      {
        $project: {
          _id: 1,
          active: 1,
          publish: 1,
          productSku: 1,
          productName: 1,
          productDescription: 1,
          category: 1,
          hsn: 1,
          minStock: 1,
          images: 1,
          primaryVehicle: 1,
          secondaryVehicle: 1,
          isWarrantable: 1,
          productWeight: 1,
          height: 1,
          width: 1,
          batchNo: 1,
          baseunit: 1,
          secondaryUnit: 1,
          operatedBy: {
            _id: { $arrayElemAt: ["$operatedByAlias._id", 0] },
            fname: { $arrayElemAt: ["$operatedByAlias.fname", 0] },
            lname: { $arrayElemAt: ["$operatedByAlias.lname", 0] },
            email: { $arrayElemAt: ["$operatedByAlias.email", 0] },
            mobile: { $arrayElemAt: ["$operatedByAlias.mobile", 0] },
            profileImage: {
              $arrayElemAt: ["$operatedByAlias.profileImage", 0],
            },
          },
          createdBy: {
            _id: { $arrayElemAt: ["$createdByAlias._id", 0] },
            fname: { $arrayElemAt: ["$createdByAlias.fname", 0] },
            lname: { $arrayElemAt: ["$createdByAlias.lname", 0] },
            email: { $arrayElemAt: ["$createdByAlias.email", 0] },
            mobile: { $arrayElemAt: ["$createdByAlias.mobile", 0] },
            profileImage: {
              $arrayElemAt: ["$createdByAlias.profileImage", 0],
            },
          },
          updatedAt: 1,
          createdAt: 1,
        },
      },
      { $match: search },
      { $sort: sort },
      { $skip: page * pageSize },
      { $limit: pageSize },
    ]);
    UtilController.sendSuccess(req, res, next, {
      rows: inventory,
      filterRecords: inventory.length,
      pages: Math.ceil(inventory.length / pageSize),
    });
  } catch (err) {
    UtilController.sendError(req, res, next, err);
  }
};
