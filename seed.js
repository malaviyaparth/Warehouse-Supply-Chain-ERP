require("dotenv").config();
const mongoose = require("mongoose"),
  Role = require("./Models/Role"),
  Permission = require("./Models/Permission"),
  Employee = require("./Models/Employee"),
  { hashPassword } = require("./services/auth");
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    let role = await Role.findOne({ roleName: "ADMIN" });
    if (!role)
      role = await Role.create({
        roleName: "ADMIN",
        description: "System administrator",
      });
    const names = [
      "MANAGE_USERS",
      "MANAGE_PRODUCTS",
      "MANAGE_INVENTORY",
      "MANAGE_PURCHASES",
      "MANAGE_SALES",
      "VIEW_REPORTS",
    ];
    for (const name of names) {
      let p = await Permission.findOne({ permissionName: name });
      if (!p)
        p = await Permission.create({
          permissionName: name,
          description: name.replaceAll("_", " "),
          role: role._id,
        });
      if (!role.permissions.some((x) => String(x) === String(p._id)))
        role.permissions.push(p._id);
    }
    await role.save();
    let e = await Employee.findOne({ email: "admin@example.com" });
    if (!e)
      e = await Employee.create({
        name: "System Admin",
        email: "admin@example.com",
        password: await hashPassword("Admin@123"),
        department: "ADMIN",
        role: role._id,
      });
    console.log("Seed complete. Login: admin@example.com / Admin@123");
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
