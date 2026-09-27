require("dotenv").config();
const mongoose = require("mongoose");
const Role = require("./Models/Role");
const Permission = require("./Models/Permission");
const Employee = require("./Models/Employee");
const { hashPassword } = require("./services/authService");
const { ROLES, normalizeRole } = require("./Middleware/roleMiddleware");

const permissionsData = [
  // Super Admin / System Administration
  { permissionName: "employee.manage", module: "ADMIN", description: "Manage employees" },
  { permissionName: "role.manage", module: "ADMIN", description: "Manage roles and permissions" },
  { permissionName: "settings.manage", module: "ADMIN", description: "Manage company & system settings" },
  { permissionName: "audit.view", module: "ADMIN", description: "View audit logs" },
  { permissionName: "reports.view_all", module: "ADMIN", description: "View all organizational reports" },

  // Master Data
  { permissionName: "master.manage", module: "MASTER", description: "Manage master products, categories, brands" },
  { permissionName: "category.view", module: "MASTER", description: "View categories" },
  { permissionName: "category.manage", module: "MASTER", description: "Create/edit categories" },
  { permissionName: "brand.view", module: "MASTER", description: "View brands" },
  { permissionName: "brand.manage", module: "MASTER", description: "Create/edit brands" },
  { permissionName: "product.view", module: "MASTER", description: "View products" },
  { permissionName: "product.manage", module: "MASTER", description: "Create/edit products" },
  { permissionName: "variant.view", module: "MASTER", description: "View product variants" },
  { permissionName: "variant.manage", module: "MASTER", description: "Manage product variants" },
  { permissionName: "warehouse.view", module: "MASTER", description: "View warehouse locations" },
  { permissionName: "warehouse.manage", module: "MASTER", description: "Create/edit warehouses" },
  { permissionName: "vendor.view", module: "MASTER", description: "View vendors and suppliers" },
  { permissionName: "vendor.manage", module: "MASTER", description: "Manage vendors" },
  { permissionName: "customer.view", module: "MASTER", description: "View customer accounts" },
  { permissionName: "customer.manage", module: "MASTER", description: "Manage customers" },

  // Procurement (Purchase Manager)
  { permissionName: "purchase_request.create", module: "PURCHASE", description: "Create purchase requests" },
  { permissionName: "purchase_request.view", module: "PURCHASE", description: "View purchase requests" },
  { permissionName: "purchase_request.approve", module: "PURCHASE", description: "Approve/reject purchase requests" },
  { permissionName: "purchase_order.create", module: "PURCHASE", description: "Create purchase orders" },
  { permissionName: "purchase_order.view", module: "PURCHASE", description: "View purchase orders" },
  { permissionName: "purchase_order.manage", module: "PURCHASE", description: "Manage purchase orders" },
  { permissionName: "goods_receipt.record", module: "PURCHASE", description: "Record goods receipts" },
  { permissionName: "goods_receipt.view", module: "PURCHASE", description: "View goods receipts" },
  { permissionName: "purchase.report.view", module: "PURCHASE", description: "View procurement reports" },

  // Warehouse & WMS (Warehouse Manager)
  { permissionName: "inventory.view", module: "WAREHOUSE", description: "View inventory levels across warehouses" },
  { permissionName: "inventory.manage", module: "WAREHOUSE", description: "Manage warehouse stock and limits" },
  { permissionName: "stock.in", module: "WAREHOUSE", description: "Process physical stock intake" },
  { permissionName: "stock.out", module: "WAREHOUSE", description: "Process physical stock picking/outbound" },
  { permissionName: "stock.adjust", module: "WAREHOUSE", description: "Perform stock reconciliations and adjustments" },
  { permissionName: "stock.transfer.create", module: "WAREHOUSE", description: "Create inter-warehouse transfers" },
  { permissionName: "stock.transfer.approve", module: "WAREHOUSE", description: "Approve stock transfers" },
  { permissionName: "stock.transfer.view", module: "WAREHOUSE", description: "View stock transfers" },
  { permissionName: "goods.receive", module: "WAREHOUSE", description: "Receive goods at warehouse dock" },
  { permissionName: "stock.audit.perform", module: "WAREHOUSE", description: "Perform physical stock audits" },
  { permissionName: "stock.damaged.handle", module: "WAREHOUSE", description: "Quarantine and record damaged stock" },
  { permissionName: "warehouse.report.view", module: "WAREHOUSE", description: "View warehouse and inventory reports" },

  // Commercial Sales & Deliveries (Sales Manager)
  { permissionName: "sales_order.create", module: "SALES", description: "Create customer sales orders" },
  { permissionName: "sales_order.view", module: "SALES", description: "View sales orders" },
  { permissionName: "sales_order.manage", module: "SALES", description: "Manage sales orders" },
  { permissionName: "sales_order.fulfill", module: "SALES", description: "Fulfill sales orders" },
  { permissionName: "stock.check", module: "SALES", description: "Check ATP inventory availability" },
  { permissionName: "stock.reserve", module: "SALES", description: "Reserve stock for sales orders" },
  { permissionName: "invoice.generate", module: "SALES", description: "Generate customer invoices" },
  { permissionName: "invoice.view", module: "SALES", description: "View invoices" },
  { permissionName: "invoice.manage", module: "SALES", description: "Manage invoices" },
  { permissionName: "delivery.manage", module: "SALES", description: "Manage delivery dispatches" },
  { permissionName: "delivery.assign", module: "SALES", description: "Assign deliveries" },
  { permissionName: "delivery.view", module: "SALES", description: "View deliveries and live tracking" },
  { permissionName: "delivery.status", module: "SALES", description: "Update delivery fulfillment status" },
  { permissionName: "returns.process", module: "SALES", description: "Process customer RMA returns" },
  { permissionName: "returns.view", module: "SALES", description: "View customer returns" },
  { permissionName: "sales.report.view", module: "SALES", description: "View commercial sales reports" },
];

const rolesConfig = [
  {
    roleName: ROLES.SUPER_ADMIN,
    description: "Full system access across all ERP departments, configuration, and modules",
    permissions: permissionsData.map((p) => p.permissionName),
  },
  {
    roleName: ROLES.PURCHASE_MANAGER,
    description: "Procurement officer managing vendors, purchase requests, purchase orders, and goods receipts",
    permissions: [
      "vendor.view",
      "vendor.manage",
      "purchase_request.create",
      "purchase_request.view",
      "purchase_request.approve",
      "purchase_order.create",
      "purchase_order.view",
      "purchase_order.manage",
      "goods_receipt.record",
      "goods_receipt.view",
      "goods.receive",
      "inventory.view",
      "product.view",
      "warehouse.view",
      "category.view",
      "brand.view",
      "purchase.report.view",
    ],
  },
  {
    roleName: ROLES.WAREHOUSE_MANAGER,
    description: "Warehouse manager controlling storage facilities, stock movements, adjustments, and receiving",
    permissions: [
      "warehouse.view",
      "inventory.view",
      "inventory.manage",
      "product.view",
      "category.view",
      "brand.view",
      "variant.view",
      "stock.in",
      "stock.out",
      "stock.adjust",
      "stock.transfer.create",
      "stock.transfer.approve",
      "stock.transfer.view",
      "goods.receive",
      "goods_receipt.record",
      "goods_receipt.view",
      "stock.audit.perform",
      "stock.damaged.handle",
      "purchase_order.view",
      "sales_order.view",
      "warehouse.report.view",
    ],
  },
  {
    roleName: ROLES.SALES_MANAGER,
    description: "Commercial sales manager managing customers, sales orders, stock reservations, invoices, deliveries, and returns",
    permissions: [
      "customer.view",
      "customer.manage",
      "sales_order.create",
      "sales_order.view",
      "sales_order.manage",
      "sales_order.fulfill",
      "stock.check",
      "stock.reserve",
      "inventory.view",
      "product.view",
      "category.view",
      "brand.view",
      "invoice.generate",
      "invoice.view",
      "invoice.manage",
      "delivery.manage",
      "delivery.assign",
      "delivery.view",
      "delivery.status",
      "returns.process",
      "returns.view",
      "sales.report.view",
    ],
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory");
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Permissions
    const permMap = {};
    for (const p of permissionsData) {
      let doc = await Permission.findOneAndUpdate(
        { permissionName: p.permissionName },
        { $set: p },
        { upsert: true, new: true }
      );
      permMap[p.permissionName] = doc._id;
    }
    console.log(`Synced ${Object.keys(permMap).length} Permissions.`);

    // 2. Seed 4 Canonical Roles
    const roleMap = {};
    for (const r of rolesConfig) {
      const assignedIds = r.permissions.map((name) => permMap[name]).filter(Boolean);
      let roleDoc = await Role.findOneAndUpdate(
        { roleName: r.roleName },
        {
          $set: {
            description: r.description,
            permissions: assignedIds,
            status: "ACTIVE",
          },
        },
        { upsert: true, new: true }
      );
      roleMap[r.roleName] = roleDoc._id;
    }
    console.log("Synced 4 Canonical ERP Roles: SUPER_ADMIN, PURCHASE_MANAGER, WAREHOUSE_MANAGER, SALES_MANAGER.");

    // Deactivate legacy non-canonical roles
    await Role.updateMany(
      { roleName: { $nin: Object.values(ROLES) } },
      { $set: { status: "INACTIVE" } }
    );

    // 3. Seed / Verify Default Employee Accounts for all 4 roles via env variables
    const defaultAccounts = [
      {
        name: "Super Administrator",
        email: (process.env.ADMIN_EMAIL || "admin@erp.com").toLowerCase(),
        password: process.env.ADMIN_PASSWORD || "Admin@ERP2026!",
        department: "ADMIN",
        role: roleMap[ROLES.SUPER_ADMIN],
      },
      {
        name: "Purchase Manager",
        email: (process.env.PURCHASE_EMAIL || "purchase@erp.com").toLowerCase(),
        password: process.env.PURCHASE_PASSWORD || "Purchase@ERP2026!",
        department: "PURCHASE",
        role: roleMap[ROLES.PURCHASE_MANAGER],
      },
      {
        name: "Warehouse Manager",
        email: (process.env.WAREHOUSE_EMAIL || "warehouse@erp.com").toLowerCase(),
        password: process.env.WAREHOUSE_PASSWORD || "Warehouse@ERP2026!",
        department: "WAREHOUSE",
        role: roleMap[ROLES.WAREHOUSE_MANAGER],
      },
      {
        name: "Sales Manager",
        email: (process.env.SALES_EMAIL || "sales@erp.com").toLowerCase(),
        password: process.env.SALES_PASSWORD || "Sales@ERP2026!",
        department: "SALES",
        role: roleMap[ROLES.SALES_MANAGER],
      },
    ];

    for (const acc of defaultAccounts) {
      let emp = await Employee.findOne({ email: acc.email });
      if (!emp) {
        emp = await Employee.create({
          name: acc.name,
          email: acc.email,
          password: await hashPassword(acc.password),
          department: acc.department,
          role: acc.role,
          status: "ACTIVE",
        });
        console.log(`Created default account for ${acc.name}: ${acc.email}`);
      } else {
        emp.role = acc.role;
        emp.status = "ACTIVE";
        await emp.save();
        console.log(`Verified active account for ${acc.email} with role.`);
      }
    }

    // 4. Migrate any existing employees to the 4 canonical roles
    const allEmployees = await Employee.find().populate("role");
    for (const emp of allEmployees) {
      const norm = normalizeRole(emp.role?.roleName);
      if (norm && roleMap[norm] && String(emp.role?._id) !== String(roleMap[norm])) {
        emp.role = roleMap[norm];
        await emp.save();
        console.log(`Migrated employee ${emp.email} to canonical role ${norm}`);
      } else if (!norm) {
        // Fallback by department
        let fallbackRole = ROLES.WAREHOUSE_MANAGER;
        if (emp.department === "ADMIN") fallbackRole = ROLES.SUPER_ADMIN;
        else if (emp.department === "PURCHASE") fallbackRole = ROLES.PURCHASE_MANAGER;
        else if (emp.department === "SALES" || emp.department === "LOGISTICS") fallbackRole = ROLES.SALES_MANAGER;

        emp.role = roleMap[fallbackRole];
        await emp.save();
        console.log(`Assigned employee ${emp.email} to department fallback role ${fallbackRole}`);
      }
    }

    console.log("Database seed & RBAC stabilization completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
