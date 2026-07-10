import React from "react";
import { Bill, Shop } from "../../../utils/api";

interface OnbilloReceiptProps {
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

// Code 39 Barcode Generator SVG (No external dependency)
function Code39Barcode({ value }: { value: string }) {
  const code39: Record<string, string> = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
    '/': '100100100101', '+': '100101001001', '%': '101001001001', '$': '100100101001'
  };

  const clean = `*${value.replace(/[^A-Z0-9\-\.\s\$\/\+\%]/g, '')}*`.toUpperCase();
  let pattern = '';
  for (let i = 0; i < clean.length; i++) {
    pattern += code39[clean[i]] || code39[' '];
    pattern += '0'; // Inter-character gap
  }

  const barWidth = 1.6;
  const height = 40;
  const width = pattern.length * barWidth;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <g fill="black">
        {pattern.split('').map((char, index) => {
          if (char === '1') {
            return (
              <rect
                key={index}
                x={index * barWidth}
                y={0}
                width={barWidth}
                height={height}
              />
            );
          }
          return null;
        })}
      </g>
    </svg>
  );
}

export default function OnbilloReceipt({ bill, shop }: OnbilloReceiptProps) {
  const receiptSubtotal = bill.totalPrice; // in paise
  const taxRate = shop ? parseFloat(shop.taxRate) : 18.0;
  let receiptTax = 0;
  let receiptGrandTotal = receiptSubtotal;

  if (shop && receiptSubtotal > 0) {
    if (shop.taxType === "gst_inclusive") {
      receiptTax = Math.round(receiptSubtotal - receiptSubtotal / (1 + taxRate / 100));
    } else if (shop.taxType === "gst_exclusive") {
      receiptTax = Math.round(receiptSubtotal * (taxRate / 100));
      receiptGrandTotal = receiptSubtotal + receiptTax;
    }
  }

  const cgst = shop?.taxType !== "no_tax" ? receiptTax / 2 : 0;
  const sgst = shop?.taxType !== "no_tax" ? receiptTax / 2 : 0;
  const igst = 0;
  const cess = 0;
  const totalGst = cgst + sgst;

  // Date Formatting (DD-MM-YYYY)
  const dateObj = new Date(bill.createdAt);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  // Time Formatting (HH:MM am/pm)
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;

  // Total Quantity Sum
  const totalQty = bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
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
        className="flex flex-col bg-white border border-hairline-strong/30 rounded-lg p-5 font-mono text-[10px] text-zinc-900 shadow-inner select-text print:border-none print:shadow-none print:overflow-visible print:p-0"
        style={{ width: "380px", maxWidth: "100%", margin: "0 auto", color: "#000", backgroundColor: "#fff", lineHeight: "1.3" }}
      >
        {/* Header Title */}
        <div style={{ textAlign: "center", fontSize: "11px", fontWeight: "bold" }}>
          TAX INVOICE
        </div>

        {/* Brand Name */}
        <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "900", color: "#0000ff", marginTop: "2px", letterSpacing: "0.5px" }}>
          {shop?.name || "ONBILLO SOFTWARE LTD"}
        </div>

        {/* Thick Blue Line */}
        <div style={{ borderTop: "2px solid #0000ff", margin: "2px 0 4px 0" }} />

        {/* Shop Address & Contact details */}
        <div style={{ textAlign: "center", fontSize: "10px", fontWeight: "bold", display: "flex", flexDirection: "column", gap: "1px" }}>
          <div>
            {shop?.addressLine1 || "Elangkavu, vadayar, vaikom"}
            {shop?.addressLine2 ? `, ${shop.addressLine2}` : ""}
          </div>
          <div>
            Ph = {shop?.phone || "8078311945"}
          </div>
          <div>
            E. Mail = {shop?.email || "info@onbillo.com"}
          </div>
          <div>
            GSTIN = {shop?.gstNumber || ""}
          </div>
        </div>

        {/* Double Line Separator */}
        <div style={{ borderTop: "double 3px #000", margin: "6px 0" }} />

        {/* Metadata section */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
          <div>Bill No : {bill.billNumber}</div>
          <div style={{ textAlign: "right" }}>
            <div>Date : {dateStr}</div>
            <div>Time : {timeStr}</div>
          </div>
        </div>

        {/* Thin Separator */}
        <div style={{ borderTop: "1px solid #000", margin: "6px 0" }} />

        {/* Customer details */}
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          <div>To , Cash</div>
          <div style={{ height: "4px" }} />
          <div>{shop?.phone ? shop.phone.replace("+91", "") : "1234567890"}</div>
          <div>GSTIN : </div>
        </div>

        {/* Solid Line Separator */}
        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />

        {/* Items Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 5fr 2fr 2fr 2.5fr", gap: "2px", fontWeight: "bold", color: "#0000b0", fontSize: "10px" }}>
          <span>Sr.</span>
          <span>Description</span>
          <span style={{ textAlign: "right" }}>Qty</span>
          <span style={{ textAlign: "right" }}>Rate</span>
          <span style={{ textAlign: "right" }}>Amount</span>
        </div>

        {/* Solid Line Separator */}
        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />

        {/* Item Rows */}
        <div style={{ minHeight: "40px" }}>
          {bill.items?.map((item, index) => {
            const qtyStr = item.quantity.toFixed(3);
            const rateStr = (item.unitPrice / 100).toFixed(2);
            const amountStr = ((item.unitPrice * item.quantity) / 100).toFixed(2);
            return (
              <div
                key={item.id || index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 5fr 2fr 2fr 2.5fr",
                  gap: "2px",
                  fontWeight: "bold",
                  margin: "3px 0",
                  alignItems: "start"
                }}
              >
                <span>{index + 1}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.productName}
                </span>
                <span style={{ textAlign: "right" }}>{qtyStr}</span>
                <span style={{ textAlign: "right" }}>{rateStr}</span>
                <span style={{ textAlign: "right" }}>{amountStr}</span>
              </div>
            );
          })}
        </div>

        {/* Double Line Separator */}
        <div style={{ borderTop: "double 3px #000", margin: "6px 0" }} />

        {/* Total Quantity */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11px" }}>
          <span>Total Qty</span>
          <span>{totalQty.toFixed(2)}</span>
        </div>

        {/* Solid Line Separator */}
        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />

        {/* Total Pricing details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontWeight: "bold" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Gross Amount After Discount</span>
            <span>{(receiptSubtotal / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Bill Discount</span>
            <span>0.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "900", margin: "2px 0" }}>
            <span>Net Amount</span>
            <span>{(receiptGrandTotal / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Retro Separator (Dash Line) */}
        <div style={{ textAlign: "center", fontSize: "10px", margin: "4px 0", letterSpacing: "-0.5px" }}>
          =============================================
        </div>

        {/* Amount in words */}
        <div style={{ fontWeight: "bold", fontSize: "9px", textTransform: "uppercase", marginBottom: "8px" }}>
          {numberToIndianWords(receiptGrandTotal / 100)}
        </div>

        {/* Tender Details Box */}
        <div style={{ border: "1px solid #000", padding: "8px", position: "relative", marginTop: "12px", borderRadius: "2px" }}>
          {/* Legend Label */}
          <div
            style={{
              position: "absolute",
              top: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#fff",
              padding: "0 6px",
              border: "1px solid #000",
              fontSize: "8px",
              fontWeight: "bold",
              borderRadius: "2px"
            }}
          >
            Tender Details
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontWeight: "bold", fontSize: "9px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Credit Amount</span>
              <span>0.00 Cr</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tend Amount</span>
              <span>{(receiptGrandTotal / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Balance Amount</span>
              <span>0.00</span>
            </div>
          </div>
        </div>

        {/* Details of GST Tax Section */}
        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "9px", fontWeight: "bold", textDecoration: "underline", marginBottom: "6px" }}>
            DETAILS OF GST TAX
          </div>
          
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "8px", fontWeight: "bold" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ borderRight: "1px solid #000", padding: "3px 0", color: "#a52a2a" }}>CGST</th>
                <th style={{ borderRight: "1px solid #000", padding: "3px 0", color: "#a52a2a" }}>SGST</th>
                <th style={{ borderRight: "1px solid #000", padding: "3px 0", color: "#a52a2a" }}>IGST</th>
                <th style={{ borderRight: "1px solid #000", padding: "3px 0", color: "#a52a2a" }}>CESS</th>
                <th style={{ padding: "3px 0", color: "#a52a2a" }}>Total GST</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderRight: "1px solid #000", padding: "4px 0" }}>{(cgst / 100).toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #000", padding: "4px 0" }}>{(sgst / 100).toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #000", padding: "4px 0" }}>{(igst / 100).toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #000", padding: "4px 0" }}>{(cess / 100).toFixed(2)}</td>
                <td style={{ padding: "4px 0" }}>{(totalGst / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Barcode */}
        <div style={{ margin: "14px 0 6px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Code39Barcode value={bill.billNumber} />
        </div>

        {/* Footer message */}
        <div style={{ textAlign: "center", fontSize: "9px", fontWeight: "bold", marginTop: "4px" }}>
          <div>Have a Nice day</div>
          <div>Thanks for your Kind Visit</div>
        </div>
      </div>
    </>
  );
}
