const Employee = require("../Models/Employee");
const Role = require("../Models/Role");
const { hashPassword, comparePassword, setUser } = require("../services/auth");

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, role } = req.body;
    if (!name || !email || !password || !department || !role)
      return res
        .status(400)
        .json({
          success: false,
          message: "name, email, password, department and role are required",
        });
    if (password.length < 6)
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
    const employeeCount = await Employee.countDocuments();
    if (employeeCount > 0)
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Public registration is disabled. An administrator must create employee accounts.",
        });
    const roleDoc = await Role.findById(role);
    if (!roleDoc)
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    const employee = await Employee.create({
      name,
      email,
      password: await hashPassword(password),
      phone,
      department,
      role,
    });
    const populated = await Employee.findById(employee._id).populate(
      "role",
      "roleName permissions",
    );
    res
      .status(201)
      .json({
        success: true,
        data: {
          id: populated._id,
          name: populated.name,
          email: populated.email,
          role: populated.role,
        },
      });
  } catch (e) {
    next(e);
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    const employee = await Employee.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate({ path: "role", populate: { path: "permissions" } });
    if (!employee || !(await comparePassword(password, employee.password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    if (employee.status !== "ACTIVE")
      return res
        .status(403)
        .json({ success: false, message: "Employee account is not active" });
    const payload = {
      id: employee._id,
      roleId: employee.role._id,
      roleName: employee.role.roleName,
      name: employee.name,
      email: employee.email,
    };
    const token = setUser(payload);
    res.json({
      success: true,
      token,
      user: {
        ...payload,
        permissions: employee.role.permissions.map((p) => p.permissionName),
      },
    });
  } catch (e) {
    next(e);
  }
};
const me = async (req, res, next) => {
  try {
    const d = await Employee.findById(req.user.id)
      .populate("role", "roleName permissions")
      .select("-password");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
module.exports = { register, login, me };
