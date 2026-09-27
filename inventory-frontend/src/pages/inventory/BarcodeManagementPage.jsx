import React, { useState, useEffect } from "react";
import { Barcode, Printer, Search, RefreshCw, Check } from "lucide-react";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const BarcodeManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/products");
      const list = res.data?.data || [];
      setProducts(list);
      if (list.length > 0 && !selectedProductId) {
        setSelectedProductId(list[0]._id);
        setBarcodeInput(list[0].barcode || "");
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load catalog products.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const currentProduct = products.find((p) => p._id === selectedProductId) || products[0];

  const handleSelectProduct = (id) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p._id === id);
    setBarcodeInput(prod?.barcode || "");
  };

  const handleGenerateBarcode = () => {
    // Generate a unique 12-digit UPC/EAN-like number
    const generated = "89" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setBarcodeInput(generated);
  };

  const handleAssignBarcode = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;
    setSaving(true);
    try {
      await api.put(`/api/products/${currentProduct._id}`, {
        barcode: barcodeInput.trim() || undefined,
      });
      setToast({ message: "Barcode assigned and synchronized.", type: "success" });
      fetchProducts();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to assign barcode.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Barcode & SKU Tag Generator</h1>
          <p>Thermal barcode label synthesis, GS1 standard formatting, and bin label assignment</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn-primary" onClick={handlePrint} disabled={!currentProduct}>
            <Printer size={16} />
            <span>Print Thermal Label</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading catalog products...
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state card-panel">
          <Barcode size={36} color="var(--color-slate-400)" />
          <h3>No Products in Catalog</h3>
          <p>Create products first to generate and associate barcodes.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Barcode Assignment Form */}
          <div className="card-panel">
            <div className="card-panel-title" style={{ marginBottom: "18px" }}>
              Barcode Configuration & Assignment
            </div>

            <form onSubmit={handleAssignBarcode}>
              <div className="form-field">
                <label>Select Target Inventory Item *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  required
                >
                  {products.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.sku} — {item.productName} {item.barcode ? `[🏷️ ${item.barcode}]` : "[No Barcode]"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Barcode / GTIN Value</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter or generate barcode"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleGenerateBarcode}
                    title="Generate random unique EAN-12 barcode"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Barcode Assignment"}
                </button>
              </div>
            </form>
          </div>

          {/* Live Thermal Label Preview */}
          <div className="card-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="card-panel-title" style={{ marginBottom: "18px", alignSelf: "flex-start" }}>
              High-Resolution Thermal Tag Preview
            </div>

            {currentProduct && (
              <div
                style={{
                  width: "360px",
                  padding: "24px",
                  background: "#ffffff",
                  border: "2px dashed var(--color-slate-300)",
                  borderRadius: "var(--radius-lg)",
                  textAlign: "center",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <div style={{ fontSize: "10.5px", fontWeight: "800", textTransform: "uppercase", color: "var(--color-slate-500)", letterSpacing: "1px" }}>
                  INVENTORY PRO ERP &bull; ASSET TAG
                </div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--color-slate-900)", margin: "6px 0 2px" }}>
                  {currentProduct.productName}
                </div>
                <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--color-primary-700)", fontWeight: "700", marginBottom: "16px" }}>
                  {currentProduct.sku}
                </div>

                {/* Visual SVG Barcode Simulation */}
                <div style={{ margin: "0 auto 12px", display: "flex", justifyContent: "center" }}>
                  <svg width="240" height="60" viewBox="0 0 240 60">
                    <rect x="0" y="0" width="240" height="60" fill="#ffffff" />
                    {[4, 8, 14, 18, 26, 30, 36, 44, 48, 56, 62, 68, 74, 82, 88, 96, 102, 108, 116, 122, 130, 138, 144, 150, 158, 166, 172, 180, 186, 194, 202, 208, 216, 222, 228, 234].map((x, i) => (
                      <rect key={i} x={x} y="0" width={i % 3 === 0 ? "4" : i % 2 === 0 ? "2" : "1"} height="60" fill="#0f172a" />
                    ))}
                  </svg>
                </div>

                <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "700", letterSpacing: "3px", color: "var(--color-slate-800)" }}>
                  {currentProduct.barcode || barcodeInput || "*NO-BARCODE*"}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-slate-400)", marginTop: "6px" }}>
                  Unit Price: ${Number(currentProduct.unitPrice || 0).toFixed(2)} &bull; GS1 Standard
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeManagementPage;
