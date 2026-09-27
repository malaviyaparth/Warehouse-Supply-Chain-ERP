import React, { useState, useEffect } from "react";
import { PackageCheck, Truck, AlertTriangle, CheckCircle, RefreshCw, Eye } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const GoodsReceivingPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal State
  const [selectedPO, setSelectedPO] = useState(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    warehouseId: "",
    remarks: "",
    items: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, whRes, grRes] = await Promise.all([
        axiosInstance.get("/api/purchases"),
        axiosInstance.get("/api/warehouses"),
        axiosInstance.get("/api/goods-receipts"),
      ]);

      const poData = poRes.data?.data || poRes.data || [];
      const whData = whRes.data?.data || whRes.data || [];
      const grData = grRes.data?.data || grRes.data || [];

      // Filter POs ready for dock receiving: APPROVED or PARTIALLY_RECEIVED
      const pendingPOs = (Array.isArray(poData) ? poData : []).filter(
        (po) => po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED"
      );

      setPurchaseOrders(pendingPOs);
      setWarehouses(Array.isArray(whData) ? whData : []);
      setReceipts(Array.isArray(grData) ? grData : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load receiving data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReceiveModal = (po) => {
    setSelectedPO(po);
    const initialItems = (po.items || []).map((it) => {
      const remaining = Math.max(0, it.quantity - (it.receivedQuantity || 0));
      return {
        product: it.product?._id || it.product,
        productName: it.product?.productName || "Item",
        sku: it.product?.sku || "",
        orderedQuantity: it.quantity,
        alreadyReceived: it.receivedQuantity || 0,
        receivedQuantity: remaining,
        damagedQuantity: 0,
      };
    });

    setReceiveForm({
      warehouseId: po.warehouse?._id || po.warehouse || (warehouses[0]?._id || ""),
      remarks: "",
      items: initialItems,
    });
    setIsReceiveModalOpen(true);
  };

  const handleItemQtyChange = (index, field, value) => {
    const updated = [...receiveForm.items];
    updated[index][field] = Number(value) || 0;
    setReceiveForm({ ...receiveForm, items: updated });
  };

  const handleSubmitReceipt = async (e) => {
    e.preventDefault();
    if (!receiveForm.warehouseId) {
      setToast({ type: "error", message: "Please select a warehouse." });
      return;
    }

    const payload = {
      purchaseOrderId: selectedPO._id,
      warehouseId: receiveForm.warehouseId,
      remarks: receiveForm.remarks,
      items: receiveForm.items.map((it) => ({
        product: it.product,
        receivedQuantity: it.receivedQuantity,
        damagedQuantity: it.damagedQuantity,
      })),
    };

    try {
      setSubmitting(true);
      await axiosInstance.post("/api/goods-receipts", payload);
      setToast({ type: "success", message: "Goods Receipt processed and inventory updated!" });
      setIsReceiveModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to record goods receipt.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const poColumns = [
    {
      header: "PO Number",
      accessor: "purchaseOrderNumber",
      render: (val, row) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val || `PO-${String(row._id).slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: "Vendor",
      accessor: "vendor",
      render: (val) => <span style={{ fontWeight: "600" }}>{val?.name || "Vendor"}</span>,
    },
    {
      header: "Designated Facility",
      accessor: "warehouse",
      render: (val) => val?.name || val?.warehouseName || "Central",
    },
    {
      header: "Order Items",
      accessor: "items",
      render: (items) => (
        <div>
          {items?.map((it, idx) => (
            <div key={idx} style={{ fontSize: "13px" }}>
              <strong>{it.product?.productName || "Product"}</strong> &bull; Ordered: {it.quantity} (Recv: {it.receivedQuantity || 0})
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span className={`badge ${val === "APPROVED" ? "badge-info" : "badge-warning"}`}>
          {val}
        </span>
      ),
    },
    {
      header: "Action",
      accessor: "_id",
      render: (_, row) => (
        <button
          type="button"
          className="btn-primary"
          style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
          onClick={() => openReceiveModal(row)}
        >
          <PackageCheck size={14} /> Receive Intake
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Dock Inbound Goods Receiving</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Verify arriving shipments against Approved Purchase Orders, inspect for damage, and log GRNs into inventory.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Dock Inbounds</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-warning-50)", color: "var(--color-warning-700)" }}>
              <Truck size={20} />
            </div>
          </div>
          <div className="stat-value">{purchaseOrders.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Approved POs awaiting receiving</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total GRNs Processed</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-success-50)", color: "var(--color-success-700)" }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{receipts.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Verified goods intake logs</span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>
          Inbound Shipments Awaiting Intake
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--color-slate-500)" }}>
            Checking approved purchase orders...
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="empty-state">
            <PackageCheck size={44} style={{ margin: "0 auto", opacity: 0.3 }} />
            <h3>No pending dock inbounds</h3>
            <p>All approved purchase orders have been received or none are currently scheduled.</p>
          </div>
        ) : (
          <DataTable
            columns={poColumns}
            data={purchaseOrders}
            searchPlaceholder="Filter by PO number or vendor..."
          />
        )}
      </div>

      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={`Receive Goods - ${selectedPO?.purchaseOrderNumber || "PO Intake"}`}
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsReceiveModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmitReceipt}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Confirm & Update Inventory"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitReceipt} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-field">
            <label>Receiving Facility / Warehouse *</label>
            <select
              value={receiveForm.warehouseId}
              onChange={(e) => setReceiveForm({ ...receiveForm, warehouseId: e.target.value })}
              required
            >
              <option value="">Select facility...</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name || w.warehouseName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Item Breakdown & Quality Inspection</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              {receiveForm.items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    background: "var(--color-slate-50)",
                    borderRadius: "6px",
                    border: "1px solid var(--color-slate-200)",
                  }}
                >
                  <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>
                    {it.productName} ({it.sku})
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate-600)", marginBottom: "8px" }}>
                    Total Ordered: {it.orderedQuantity} &bull; Previously Received: {it.alreadyReceived}
                  </div>
                  <div className="form-grid-2">
                    <div>
                      <label style={{ fontSize: "12px" }}>Accepted Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={it.receivedQuantity}
                        onChange={(e) => handleItemQtyChange(idx, "receivedQuantity", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px" }}>Damaged Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={it.damagedQuantity}
                        onChange={(e) => handleItemQtyChange(idx, "damagedQuantity", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Receiving Notes & Carrier Bill of Lading</label>
            <textarea
              rows="2"
              value={receiveForm.remarks}
              onChange={(e) => setReceiveForm({ ...receiveForm, remarks: e.target.value })}
              placeholder="e.g. Carrier invoice #9019, seal intact, slight outer box scuff."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GoodsReceivingPage;
