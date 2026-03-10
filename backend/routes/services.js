const express = require("express");
const router = express.Router();
const Service = require("../models/Service");

// GET All Active Services (Public)
router.get("/", async (req, res) => {
  try {
    const services = await Service.find({ is_active: true })
      .select('service_name description price category icon icon_file')
      .sort({ created_at: -1 })
      .lean();

    // Transform _id to id for frontend consistency
    const transformedServices = services.map(service => ({
      id: service._id,
      service_name: service.service_name,
      description: service.description,
      price: service.price,
      category: service.category,
      icon: service.icon,
      icon_file: service.icon_file
    }));

    res.json({ services: transformedServices });
  } catch (error) {
    console.error("Get public services error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
