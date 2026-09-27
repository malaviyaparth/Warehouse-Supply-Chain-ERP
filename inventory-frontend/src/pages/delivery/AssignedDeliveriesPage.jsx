import React, { useState, useEffect } from "react";
import { Truck, CheckCircle, AlertTriangle, MapPin, Check, RefreshCw, XCircle, Plus, UserCheck } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const AssignedDeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Status Modal State
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [modalType, setModalType] = useState("COMPLETE"); // COMPLETE or FAIL
  const [notes, setNotes] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Assign New Dispatch Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createFormData, setCreateFormData] = useState({
    salesOrder: "",
    assignedEmployee: "",
    deliveryAddress: "",
    recipientContact: "",
    remarks: "",
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await axiosInstance.get("/api/deliveries");
      } catch {
        res = await axiosInstance.get("/api/deliveries/assigned-to-me");
      }
      const list = res.data?.data || [];
      setDeliveries(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load assigned deliveries.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [soRes, empRes] = await Promise.all([
        axiosInstance.get("/api/sales-orders"),
        axiosInstance.get("/api/employees"),
      ]);
      const soList = soRes.data?.data || [];
      const empList = empRes.data?.data || [];
      setSalesOrders(Array.isArray(soList) ? soList : []);
      setEmployees(Array.isArray(empList) ? empList : []);
    } catch (err) {
      console.error("Failed to load dispatch dropdown options:", err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchDropdownData();
  }, []);

  const openCreateModal = () => {
    fetchDropdownData();
    setIsCreateModalOpen(true);
  };

  const handleOrderSelect = (orderId) => {
    const selectedSO = salesOrders.find((s) => s._id === orderId);
    setCreateFormData((prev) => ({
      ...prev,
      salesOrder: orderId,
      deliveryAddress: selectedSO?.customer?.address || "Customer Destination Bay",
      recipientContact: selectedSO?.customer?.phone || "",
    }));
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    if (!createFormData.salesOrder) {
      setToast({ type: "error", message: "Please select a sales order to dispatch." });
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosInstance.post("/api/deliveries", createFormData);
      setToast({
        type: "success",
        message: `Dispatch ${res.data?.data?.deliveryNumber || "manifest"} created & assigned successfully!`,
      });
      setIsCreateModalOpen(false);
      setCreateFormData({
        salesOrder: "",
        assignedEmployee: "",
        deliveryAddress: "",
        recipientContact: "",
        remarks: "",
      });
      fetchDeliveries();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to create delivery dispatch.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axiosInstance.put(`/api/deliveries/${id}/status`, { status: newStatus });
      setToast({ type: "success", message: `Delivery marked as ${newStatus}.` });
      fetchDeliveries();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update delivery status.",
      });
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      setSubmitting(true);
      if (modalType === "COMPLETE") {
        await axiosInstance.put(`/api/deliveries/${selectedDelivery._id}/status`, {
          status: "DELIVERED",
          remarks: notes || "Delivered and confirmed by recipient",
        });
        setToast({ type: "success", message: "Delivery confirmed and sales order marked as DELIVERED!" });
      } else {
        await axiosInstance.put(`/api/deliveries/${selectedDelivery._id}/status`, {
          status: "FAILED",
          failureReason: failureReason || "Delivery attempt failed",
          remarks: notes,
        });
        setToast({ type: "warning", message: "Delivery exception logged." });
      }

      setSelectedDelivery(null);
      setNotes("");
      setFailureReason("");
      fetchDeliveries();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to record delivery status.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: "Waybill Reference",
      accessor: "deliveryNumber",
      render: (val, row) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val || `DEL-${String(row._id).slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: "Client & Destination",
      accessor: "customer",
      render: (c, row) => (
        <div>
          <div style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>
            {c?.customerName || c?.name || "Client Recipient"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-slate-500)", display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={11} />
            {row.deliveryAddress || c?.address || "Address"}
          </div>
        </div>
      ),
    },
    {
      header: "Sales Order",
      accessor: "salesOrder",
      render: (so) => so?.salesOrderNumber || "SO Ref",
    },
    {
      header: "Origin Facility",
      accessor: "warehouse",
      render: (w) => w?.name || w?.warehouseName || "Terminal",
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => {
        let badgeClass = "badge-pending";
        if (val === "DELIVERED") badgeClass = "badge-active";
        if (val === "IN_TRANSIT") badgeClass = "badge-warning";
        if (val === "FAILED") badgeClass = "badge-inactive";
        return <span className={`badge ${badgeClass}`}>{val}</span>;
      },
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id, row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          {row.status === "ASSIGNED" && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={() => handleUpdateStatus(id, "IN_TRANSIT")}
            >
              Start Transit
            </button>
          )}
          {(row.status === "ASSIGNED" || row.status === "IN_TRANSIT") && (
            <>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: "4px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "3px" }}
                onClick={() => {
                  setSelectedDelivery(row);
                  setModalType("COMPLETE");
                }}
              >
                <Check size={12} /> Confirm Delivered
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", color: "var(--color-rose-600)" }}
                onClick={() => {
                  setSelectedDelivery(row);
                  setModalType("FAIL");
                }}
              >
                Report Exception
              </button>
            </>
          )}
          {row.status === "DELIVERED" && (
            <span style={{ fontSize: "12px", color: "var(--color-emerald-700)", fontWeight: "600" }}>
              Completed
            </span>
          )}
          {row.status === "FAILED" && (
            <span style={{ fontSize: "12px", color: "var(--color-rose-600)", fontWeight: "600" }}>
              Failed
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Assigned Courier Deliveries</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Operational transit queue assigned to delivery personnel with real-time proof-of-delivery handover.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="btn-secondary" onClick={fetchDeliveries} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={15} />
            <span>Assign New Dispatch</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading assigned deliveries...
        </div>
      ) : deliveries.length === 0 ? (
        <div className="empty-state">
          <Truck size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No deliveries currently assigned</h3>
          <p>You have no pending route manifests assigned to your profile.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={deliveries}
          searchPlaceholder="Search delivery waybill or client..."
        />
      )}

      <Modal
        isOpen={Boolean(selectedDelivery)}
        onClose={() => setSelectedDelivery(null)}
        title={
          modalType === "COMPLETE"
            ? `Complete Delivery - ${selectedDelivery?.deliveryNumber || "Waybill"}`
            : `Log Delivery Exception - ${selectedDelivery?.deliveryNumber || "Waybill"}`
        }
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedDelivery(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalType === "COMPLETE" ? "btn-primary" : "btn-secondary"}
              style={modalType === "FAIL" ? { color: "var(--color-rose-600)" } : {}}
              onClick={handleConfirmDelivery}
              disabled={submitting}
            >
              {submitting ? "Saving..." : modalType === "COMPLETE" ? "Confirm Handover" : "Submit Exception"}
            </button>
          </>
        }
      >
        <form onSubmit={handleConfirmDelivery} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "12px", background: "var(--color-slate-50)", borderRadius: "6px" }}>
            <div style={{ fontWeight: "600" }}>{selectedDelivery?.customer?.customerName || "Customer"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-slate-600)" }}>
              {selectedDelivery?.deliveryAddress || "Address"}
            </div>
          </div>

          {modalType === "FAIL" ? (
            <div className="form-field">
              <label>Reason for Failed Delivery *</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                required
              >
                <option value="">Select reason...</option>
                <option value="Customer Unavailable / Gate Locked">Customer Unavailable / Gate Locked</option>
                <option value="Incorrect Destination Address">Incorrect Destination Address</option>
                <option value="Customer Refused Shipment">Customer Refused Shipment</option>
                <option value="Vehicle Breakdown or Traffic Delay">Vehicle Breakdown or Traffic Delay</option>
              </select>
            </div>
          ) : (
            <div className="form-field">
              <label>Handover Signature / Recipient Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe, Receiving Supervisor"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Assign New Dispatcher Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign Dispatcher & Route Delivery"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreateDispatch}
              disabled={submitting}
            >
              {submitting ? "Assigning..." : "Assign Dispatcher"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateDispatch} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-field">
            <label>Select Sales Order *</label>
            <select
              value={createFormData.salesOrder}
              onChange={(e) => handleOrderSelect(e.target.value)}
              required
            >
              <option value="">-- Choose Sales Order to Dispatch --</option>
              {salesOrders.map((so) => (
                <option key={so._id} value={so._id}>
                  {so.salesOrderNumber || `SO-${so._id.slice(-6)}`} - {so.customer?.customerName || "Customer"} (${so.totalAmount ? `$${so.totalAmount}` : "Order"}) - [{so.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Assign Dispatcher / Delivery Personnel</label>
            <select
              value={createFormData.assignedEmployee}
              onChange={(e) => setCreateFormData({ ...createFormData, assignedEmployee: e.target.value })}
            >
              <option value="">-- Select Courier Staff / Driver --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.department || "Operations"} - {emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Destination Delivery Address *</label>
            <input
              type="text"
              placeholder="e.g. 104 Industrial Parkway, Loading Dock #4"
              value={createFormData.deliveryAddress}
              onChange={(e) => setCreateFormData({ ...createFormData, deliveryAddress: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Recipient Contact Number</label>
            <input
              type="text"
              placeholder="e.g. +1 555-892-1200"
              value={createFormData.recipientContact}
              onChange={(e) => setCreateFormData({ ...createFormData, recipientContact: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Vehicle No. / Dispatch Route Remarks</label>
            <input
              type="text"
              placeholder="e.g. Vehicle TRK-8821, Morning Priority Dispatch"
              value={createFormData.remarks}
              onChange={(e) => setCreateFormData({ ...createFormData, remarks: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssignedDeliveriesPage;
