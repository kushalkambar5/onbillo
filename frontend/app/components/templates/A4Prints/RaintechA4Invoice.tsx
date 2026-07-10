import React from "react";
import { Bill, Shop } from "../../../utils/api";

interface RaintechA4InvoiceProps {
  bill: Bill;
  shop: Shop | null;
}

export default function RaintechA4Invoice({ bill, shop }: RaintechA4InvoiceProps) {
  // Date Formatting (DD-MM-YYYY)
  let dateStr = "03-04-2024";
  try {
    const dateObj = new Date(bill.createdAt);
    if (!isNaN(dateObj.getTime())) {
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const yyyy = dateObj.getFullYear();
      dateStr = `${dd}-${mm}-${yyyy}`;
    }
  } catch (e) {
    // Fallback to default
  }

  // Totals calculations
  const subtotal = bill.totalPrice; // in paise
  const taxRate = shop ? parseFloat(shop.taxRate) : 0.0;
  let tax = 0;
  let grandTotal = subtotal;

  if (shop && subtotal > 0) {
    if (shop.taxType === "gst_inclusive") {
      tax = Math.round(subtotal - subtotal / (1 + taxRate / 100));
    } else if (shop.taxType === "gst_exclusive") {
      tax = Math.round(subtotal * (taxRate / 100));
      grandTotal = subtotal + tax;
    }
  }

  const formatRupees = (paise: number) => {
    return (paise / 100).toFixed(2);
  };

  // Render items and fill empty rows up to minRows
  const items = bill.items || [];
  const minRows = 10;
  const emptyRowsCount = Math.max(0, minRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @media print {
          html, body {
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      ` }} />

      <div
        id="printable-receipt"
        className="print:border-none print:shadow-none print:p-0"
        style={{
          width: "210mm",
          height: "297mm",
          padding: "15mm 20mm",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          border: "1px solid #e4e4e7",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header Section */}
        <div style={{ display: "flex", height: "140px", position: "relative" }}>
          {/* Blue Chevron Banner Shape */}
          <div style={{ position: "absolute", left: "-20mm", top: "-15mm", width: "310px", height: "150px", zIndex: 1 }}>
            <svg viewBox="0 0 310 150" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M 0 0 L 240 0 C 280 0, 310 30, 310 75 C 310 120, 280 150, 240 150 L 0 150 Z" fill="#0B3C9B" />
            </svg>
          </div>

          {/* White Logo Box */}
          <div style={{
            position: "absolute",
            left: "calc(-20mm + 50px)",
            top: "25px",
            width: "100px",
            height: "100px",
            backgroundColor: "#fff",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            borderRadius: "4px"
          }}>
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="Logo" style={{ maxWidth: "85px", maxHeight: "85px", objectFit: "contain" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: "900", color: "#000", letterSpacing: "1px", lineHeight: "1.1" }}>LOGO</span>
                <span style={{ fontSize: "18px", fontWeight: "900", color: "#000", letterSpacing: "1px", lineHeight: "1.1" }}>HERE</span>
              </div>
            )}
          </div>

          {/* Business Details Column */}
          <div style={{
            marginLeft: "280px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            paddingTop: "5px"
          }}>
            <h1 style={{
              fontSize: "36px",
              fontWeight: "900",
              color: "#0B3C9B",
              margin: "0 0 8px 0",
              letterSpacing: "1.5px",
              fontFamily: "'Inter', sans-serif"
            }}>
              INVOICE
            </h1>
            <h2 style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0F172A",
              margin: "0 0 2px 0",
              letterSpacing: "0.5px"
            }}>
              {shop?.name || "RAINTECH"}
            </h2>
            <p style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "#475569",
              margin: "0 0 4px 0"
            }}>
              {shop?.addressLine1 || "Elangkavu, vadayar, vaikom"}
              {shop?.addressLine2 ? `, ${shop.addressLine2}` : ""}
            </p>
            <div style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#334155",
              display: "flex",
              flexDirection: "column",
              gap: "2px"
            }}>
              <span>GSTIN : {shop?.gstNumber || ""} , State : {shop?.state || "Kerala"}</span>
              <span>Tel : {shop?.phone ? shop.phone.replace("+91", "").trim() : "8078311945"}</span>
            </div>
          </div>
        </div>

        {/* Divider above metadata */}
        <div style={{ borderTop: "1.5px solid #000", marginTop: "15px", marginBottom: "15px" }} />

        {/* Metadata Details Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          fontWeight: "600",
          color: "#1E293B",
          paddingBottom: "10px",
          borderBottom: "1.5px solid #000",
          marginBottom: "15px"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 10px 1fr" }}>
              <span>Invoice No.</span>
              <span>:</span>
              <span style={{ fontWeight: "700" }}>{bill.billNumber}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "110px 10px 1fr" }}>
              <span>Customer Name</span>
              <span>:</span>
              <span>Cash</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "70px 10px 1fr" }}>
              <span>Date</span>
              <span>:</span>
              <span>{dateStr}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "70px 10px 1fr" }}>
              <span>State</span>
              <span>:</span>
              <span>{shop?.state || "Kerala"}</span>
            </div>
          </div>
        </div>

        {/* Main Items Table */}
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1.5px solid #000",
          fontSize: "12px",
          fontFamily: "'Inter', sans-serif"
        }}>
          <thead>
            <tr style={{
              borderBottom: "1.5px solid #000",
              height: "38px",
              backgroundColor: "#fff",
              fontWeight: "800",
              textAlign: "center"
            }}>
              <th style={{ borderRight: "1.5px solid #000", width: "6%" }}>S.N.</th>
              <th style={{ borderRight: "1.5px solid #000", width: "49%", textAlign: "left", paddingLeft: "12px" }}>DESCRIPTION</th>
              <th style={{ borderRight: "1.5px solid #000", width: "15%" }}>QTY</th>
              <th style={{ borderRight: "1.5px solid #000", width: "15%" }}>PRICE</th>
              <th style={{ width: "15%" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {/* Render Items */}
            {items.map((item, idx) => {
              const itemPrice = item.unitPrice;
              const itemTotal = item.unitPrice * item.quantity;
              return (
                <tr key={item.id || idx} style={{ borderBottom: "1px solid #cbd5e1", height: "34px" }}>
                  <td style={{ borderRight: "1.5px solid #000", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ borderRight: "1.5px solid #000", paddingLeft: "12px", textAlign: "left", fontWeight: "700" }}>
                    {item.productName || "Product"}
                  </td>
                  <td style={{ borderRight: "1.5px solid #000", textAlign: "center", fontWeight: "700" }}>
                    {item.quantity.toFixed(1)} PCS
                  </td>
                  <td style={{ borderRight: "1.5px solid #000", padding: "0 8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span>₹</span>
                      <span>{formatRupees(itemPrice)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0 8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span>₹</span>
                      <span>{formatRupees(itemTotal)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty Filler Rows */}
            {emptyRows.map((_, idx) => (
              <tr key={`empty-${idx}`} style={{ borderBottom: "1px solid #cbd5e1", height: "34px" }}>
                <td style={{ borderRight: "1.5px solid #000" }}></td>
                <td style={{ borderRight: "1.5px solid #000" }}></td>
                <td style={{ borderRight: "1.5px solid #000" }}></td>
                <td style={{ borderRight: "1.5px solid #000" }}></td>
                <td></td>
              </tr>
            ))}

            {/* Total Row */}
            <tr style={{ height: "36px", fontWeight: "800", borderTop: "1.5px solid #000" }}>
              <td style={{ borderRight: "1.5px solid #000", textAlign: "center" }}>{items.length || 8}</td>
              <td style={{ borderRight: "1.5px solid #000", paddingLeft: "12px", textAlign: "left" }}>Total</td>
              <td style={{ borderRight: "1.5px solid #000" }}></td>
              <td style={{ borderRight: "1.5px solid #000" }}></td>
              <td style={{ padding: "0 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span>₹</span>
                  <span>{formatRupees(subtotal)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Section */}
        <div style={{
          position: "absolute",
          bottom: "15mm",
          left: "20mm",
          width: "calc(210mm - 40mm)",
          display: "flex",
          justifyContent: "space-between",
          gap: "30px",
          alignItems: "flex-end"
        }}>
          {/* Left Footer: Disclaimer bubble */}
          <div style={{ width: "55%", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{
              backgroundColor: "#E0F2FE",
              borderRadius: "12px",
              padding: "10px 16px",
              textAlign: "center",
              fontWeight: "800",
              color: "#0B3C9B",
              fontSize: "13px",
              letterSpacing: "0.5px"
            }}>
              Thank You... Visit Again !
            </div>
            <p style={{
              fontSize: "9px",
              lineHeight: "1.4",
              color: "#334155",
              textAlign: "justify",
              margin: 0,
              fontWeight: "500"
            }}>
              {shop?.footerText || `Creating terms and conditions for your website is essential for setting the "house" rules, legal protection, managing user conduct, and much more. Customizing terms and conditions according to your specific needs and requirements helps address potential risks and liabilities. Regularly updating terms and conditions in accordance with your business and legal changes will ensure continuous compliance, and maintain transparency and trust with your users.`}
            </p>
          </div>

          {/* Right Footer: Totals Box Hexagon */}
          <div style={{ width: "40%", position: "relative", height: "125px" }}>
            <svg viewBox="0 0 250 120" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }}>
              <polygon 
                points="15,2 235,2 248,60 235,118 15,118 2,60" 
                fill="#F8FAFC" 
                stroke="#0B3C9B" 
                strokeWidth="1.5" 
              />
            </svg>
            <div style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 22px",
              boxSizing: "border-box",
              zIndex: 2,
              gap: "8px",
              fontSize: "12px",
              fontWeight: "700",
              color: "#0F3E6E"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>SUB TOTAL</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span>:</span>
                  <span style={{ minWidth: "75px", textAlign: "right" }}>₹ {formatRupees(subtotal)}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>TAX</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span>:</span>
                  <span style={{ minWidth: "75px", textAlign: "right" }}>₹ {formatRupees(tax)}</span>
                </div>
              </div>
              <div style={{ borderTop: "1px dashed #0B3C9B", margin: "2px 0" }} />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                color: "#0B3C9B",
                fontWeight: "800"
              }}>
                <span>GRAND TOTAL</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span>:</span>
                  <span style={{ minWidth: "75px", textAlign: "right" }}>₹ {formatRupees(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
