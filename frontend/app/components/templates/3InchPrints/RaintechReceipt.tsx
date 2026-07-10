import React from "react";
import { Bill, Shop } from "../../../utils/api";

interface RaintechReceiptProps {
  bill: Bill;
  shop: Shop | null;
}

// Convert numbers to words in Indian format (Rupees & Paisa)
function numberToIndianWords(num: number): string {
  const a = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
    "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"
  ];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const g = ["", "THOUSAND", "LAKH", "CRORE"];

  const formatGroup = (n: number) => {
    let out = "";
    if (n >= 100) {
      out += a[Math.floor(n / 100)] + " HUNDRED ";
      n %= 100;
    }
    if (n >= 20) {
      out += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      out += a[n] + " ";
    }
    return out.trim();
  };

  const convertInt = (n: number): string => {
    if (n === 0) return "ZERO";
    let word = "";
    let str = Math.floor(n).toString();
    
    // Last 3 digits:
    const temp = parseInt(str.slice(-3));
    if (!isNaN(temp) && temp > 0) {
      word = formatGroup(temp) + " " + word;
    }
    str = str.slice(0, -3);

    // Groups of 2 digits:
    let groupIdx = 1;
    while (str.length > 0) {
      const part = parseInt(str.slice(-2));
      if (!isNaN(part) && part > 0) {
        word = formatGroup(part) + " " + (g[groupIdx] || "") + " " + word;
      }
      str = str.slice(0, -2);
      groupIdx++;
    }
    return word.trim();
  };

  const parts = num.toFixed(2).split(".");
  const rupees = parseInt(parts[0]);
  const paise = parseInt(parts[1]);

  let result = "RUPEES " + convertInt(rupees);
  if (paise > 0) {
    result += " AND " + convertInt(paise) + " PAISA";
  }
  result += " ONLY";
  return result.replace(/\s+/g, " ");
}

function DecorativeBorder() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", margin: "8px 0" }}>
      <svg viewBox="0 0 400 20" width="100%" height="20" style={{ display: "block" }}>
        {/* Left line */}
        <line x1="10" y1="8" x2="180" y2="8" stroke="#000" strokeWidth="2.5" />
        <line x1="10" y1="12" x2="175" y2="12" stroke="#000" strokeWidth="0.8" />
        
        {/* Center scroll ornament */}
        <path d="M 180 8 Q 185 0, 192 8 T 200 8 T 208 8 T 220 8" fill="none" stroke="#000" strokeWidth="1.8" />
        <path d="M 185 8 Q 192 16, 200 8 T 215 8" fill="none" stroke="#000" strokeWidth="1" />
        <circle cx="200" cy="8" r="2.5" fill="#000" />
        
        {/* Right line */}
        <line x1="220" y1="8" x2="390" y2="8" stroke="#000" strokeWidth="2.5" />
        <line x1="225" y1="12" x2="390" y2="12" stroke="#000" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

export default function RaintechReceipt({ bill, shop }: RaintechReceiptProps) {
  // Date Formatting (DD-MM-YYYY)
  let dateStr = "29-03-2024";
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
  const grossTotal = bill.totalPrice; // in paise
  const totalQty = bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Calculate discount/savings
  let totalSavings = 0;
  bill.items?.forEach((item) => {
    if (item.mrp && item.mrp > item.unitPrice) {
      totalSavings += (item.mrp - item.unitPrice) * item.quantity;
    }
  });

  const getUnit = (productName: string) => {
    if (productName.toLowerCase().includes("potato")) return "PAC";
    return "PCS";
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;700;900&display=swap');
        
        @media print {
          html, body {
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 380px !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      ` }} />

      <div
        id="printable-receipt"
        className="flex flex-col bg-white p-5 text-black shadow-inner select-text print:border-none print:shadow-none print:overflow-visible print:p-0"
        style={{
          width: "380px",
          maxWidth: "100%",
          margin: "0 auto",
          color: "#000",
          backgroundColor: "#fff",
          lineHeight: "1.3",
          border: "1.5px solid #000",
          borderRadius: "8px",
          fontFamily: "'Courier Prime', 'Inter', monospace",
          letterSpacing: "0.2px"
        }}
      >
        {/* Top Ornament */}
        <DecorativeBorder />

        {/* Logo Section */}
        {shop?.logoUrl ? (
          <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
            <img
              src={shop.logoUrl}
              alt="Shop Logo"
              style={{ maxHeight: "55px", maxWidth: "160px", objectFit: "contain" }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
            <div
              style={{
                border: "1px dashed #6b7280",
                padding: "8px 20px",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "bold",
                color: "#374151",
                letterSpacing: "1.5px",
                backgroundColor: "#f3f4f6"
              }}
            >
              LOGO HERE
            </div>
          </div>
        )}

        {/* Boxed Header */}
        <div
          style={{
            border: "1.5px solid #000",
            backgroundColor: "#d1d5db",
            textAlign: "center",
            padding: "5px 10px",
            margin: "6px 0 4px 0",
            fontWeight: "bold",
            fontSize: "14px",
            color: "#000"
          }}
        >
          {shop?.name || "RAINTECH SOFTWARE LTD"}
        </div>

        {/* Address and details */}
        <div style={{ textAlign: "center", fontSize: "10px", fontWeight: "bold", margin: "2px 0 6px 0" }}>
          <div>{shop?.addressLine1 || "Elangkavu, vadayar, vaikom"}</div>
          {shop?.addressLine2 && <div>{shop.addressLine2}</div>}
          <div style={{ marginTop: "4px" }}>
            Phone : {shop?.phone ? shop.phone.replace("+91", "").trim() : "8078311945"}
          </div>
          <div>GSTIN : {shop?.gstNumber || ""}</div>
          <div>FSSAI NO:11523057000142</div>
        </div>

        {/* BILL Text */}
        <div style={{ textAlign: "center", fontWeight: "bold", textDecoration: "underline", fontSize: "12px", margin: "4px 0" }}>
          BILL
        </div>

        {/* Customer Details */}
        <div style={{ fontSize: "10px", fontWeight: "bold", margin: "6px 0" }}>
          <div>Name &nbsp; &nbsp; &nbsp;Cash</div>
          <div>Mobile no. {shop?.phone ? shop.phone.replace("+91", "").trim() : "1234567890"}</div>
        </div>

        {/* Bill metadata enclosed in horizontal lines */}
        <div
          style={{
            borderTop: "1.2px solid #000",
            borderBottom: "1.2px solid #000",
            padding: "5px 0",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            fontWeight: "bold",
            margin: "4px 0"
          }}
        >
          <span>BILL No: &nbsp;{bill.billNumber}</span>
          <span>Date : &nbsp;{dateStr}</span>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", fontWeight: "bold", margin: "6px 0" }}>
          <thead>
            <tr style={{ borderBottom: "1.2px solid #000" }}>
              <th style={{ textAlign: "left", padding: "4px 0", width: "35%" }}>Item Name</th>
              <th style={{ textAlign: "center", padding: "4px 0", width: "20%" }}>QTY</th>
              <th style={{ textAlign: "right", padding: "4px 0", width: "15%" }}>MRP</th>
              <th style={{ textAlign: "right", padding: "4px 0", width: "15%" }}>Price</th>
              <th style={{ textAlign: "right", padding: "4px 0", width: "15%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, index) => {
              const unit = getUnit(item.productName || "");
              const mrpRate = item.mrp || item.unitPrice;
              const itemTotal = item.unitPrice * item.quantity;

              return (
                <tr key={item.id || index}>
                  <td style={{ textAlign: "left", padding: "6px 0", verticalAlign: "top" }}>
                    {item.productName}
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 0", verticalAlign: "top" }}>
                    <div>{item.quantity.toFixed(3)} {unit}</div>
                    <div style={{ fontSize: "8px", fontWeight: "normal" }}>({item.quantity} {unit})</div>
                  </td>
                  <td style={{ textAlign: "right", padding: "6px 0", verticalAlign: "top" }}>
                    {(mrpRate / 100).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", padding: "6px 0", verticalAlign: "top" }}>
                    {(item.unitPrice / 100).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", padding: "6px 0", verticalAlign: "top" }}>
                    {(itemTotal / 100).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total Qty / Payment Summary */}
        <div
          style={{
            borderTop: "1.2px solid #000",
            borderBottom: "1.2px solid #000",
            padding: "5px 0",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            fontWeight: "bold",
            margin: "4px 0"
          }}
        >
          <span style={{ width: "40%" }}>TOTAL QTY</span>
          <span style={{ width: "30%", textAlign: "center" }}>{totalQty.toFixed(2)}</span>
          <span style={{ width: "30%", textAlign: "right" }}>Cash</span>
        </div>

        {/* Payment totals summary */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            fontSize: "10px",
            fontWeight: "bold",
            margin: "6px 0"
          }}
        >
          {totalSavings > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "180px", marginBottom: "2px" }}>
              <span>Discount Amount :</span>
              <span>{(totalSavings / 100).toFixed(2)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "180px",
              fontSize: "12px",
              fontWeight: "900",
              margin: "3px 0"
            }}
          >
            <span>Total Amount :</span>
            <span>{(grossTotal / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "180px", marginBottom: "2px" }}>
            <span>Cash Given :</span>
            <span>{(grossTotal / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "180px" }}>
            <span>Cash Return :</span>
            <span>0.00</span>
          </div>
        </div>

        {/* You Saved block */}
        {totalSavings > 0 && (
          <div style={{ textAlign: "center", margin: "10px 0 8px 0" }}>
            <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>You Saved</div>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#000", marginTop: "3px" }}>
              || {(totalSavings / 100).toFixed(2)}
            </div>
          </div>
        )}

        {/* Amount in words */}
        <div style={{ fontSize: "9px", fontWeight: "bold", margin: "8px 0", textTransform: "uppercase" }}>
          Amount in Words : {numberToIndianWords(grossTotal / 100)}
        </div>

        {/* Visit again message */}
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: "bold",
            fontStyle: "italic",
            margin: "12px 0 6px 0"
          }}
        >
          Thank You... Visit Again !
        </div>

        {/* Bottom Ornament */}
        <DecorativeBorder />
      </div>
    </>
  );
}
