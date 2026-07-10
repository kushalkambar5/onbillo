import React from "react";
import { Bill, Shop } from "../../../utils/api";

interface OnbilloInvoiceProps {
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
      out += b[Math.floor(n / 10)];
      if (n % 10 > 0) {
        out += "-" + a[n % 10];
      }
    } else if (n > 0) {
      out += a[n];
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

// Code 39 Barcode Generator SVG
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

export default function OnbilloInvoice({ bill, shop }: OnbilloInvoiceProps) {
  // Calculations
  const netPayable = bill.totalPrice; // in paise
  const taxRate = shop ? parseFloat(shop.taxRate) : 18.0;
  let receiptTax = 0;

  if (shop && netPayable > 0) {
    if (shop.taxType === "gst_inclusive") {
      receiptTax = Math.round(netPayable - netPayable / (1 + taxRate / 100));
    } else if (shop.taxType === "gst_exclusive") {
      receiptTax = Math.round(netPayable * (taxRate / 100));
    }
  }

  const cgst = shop?.taxType !== "no_tax" ? receiptTax / 2 : 0;
  const sgst = shop?.taxType !== "no_tax" ? receiptTax / 2 : 0;
  const taxableAm = shop?.taxType === "gst_inclusive" ? (netPayable - receiptTax) : netPayable;
  const totalGst = cgst + sgst;

  // Calculate dynamic gross total sale & discounts
  let totalSale = 0; // Sum of MRPs
  let totalDiscount = 0;

  bill.items?.forEach((item: any) => {
    const itemMrp = item.mrp || item.unitPrice; // Fallback to unitPrice if no MRP
    totalSale += itemMrp * item.quantity;
    if (itemMrp > item.unitPrice) {
      totalDiscount += (itemMrp - item.unitPrice) * item.quantity;
    }
  });

  // Date Formatting (DD-MM-YYYY)
  const dateObj = new Date(bill.createdAt);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

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
        {/* LOGO AREA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" }}>
          {shop?.logoUrl ? (
            <img src={shop.logoUrl} alt="Logo" style={{ maxHeight: "60px", maxWidth: "200px", objectFit: "contain" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", border: "2px dashed #ccc", padding: "10px 20px", borderRadius: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "1px", color: "#888" }}>LOGO</span>
              <span style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "1px", color: "#888" }}>HERE</span>
            </div>
          )}
        </div>

        {/* Thick Horizontal Line */}
        <div style={{ borderTop: "1px solid #000", margin: "2px 0" }} />

        {/* Company Title */}
        <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", padding: "1px 0" }}>
          {shop?.name || "ONBILLO SOFTWARE LTD"}
        </div>

        {/* Thick Horizontal Line */}
        <div style={{ borderTop: "1px solid #000", margin: "2px 0" }} />

        {/* Address */}
        <div style={{ textAlign: "center", fontSize: "10px", fontWeight: "bold", padding: "1px 0" }}>
          {shop?.addressLine1 || "Elangkavu, vadayar, vaikom"}
          {shop?.addressLine2 ? `, ${shop.addressLine2}` : ""}
        </div>

        {/* Thick Horizontal Line */}
        <div style={{ borderTop: "1px solid #000", margin: "2px 0" }} />

        {/* Tax Invoice Title Banner */}
        <div style={{ textAlign: "center", fontSize: "11px", fontWeight: "bold", padding: "1px 0" }}>
          TAX INVOICE
        </div>

        {/* Thick Horizontal Line */}
        <div style={{ borderTop: "1px solid #000", margin: "2px 0 4px 0" }} />

        {/* GSTIN */}
        <div style={{ textAlign: "center", fontSize: "9px", fontWeight: "bold" }}>
          GSTIN : {shop?.gstNumber || ""}
        </div>

        {/* Customer Header */}
        <div style={{ fontWeight: "bold", marginTop: "4px" }}>
          <div>Cash</div>
          <div style={{ borderBottom: "1px solid #000", display: "inline-block", width: "120px", fontWeight: "900", paddingBottom: "1px" }}>
            {shop?.phone ? shop.phone.replace("+91", "") : "1234567890"}
          </div>
        </div>

        {/* Solid Separator */}
        <div style={{ borderTop: "1px solid #000", margin: "6px 0 4px 0" }} />

        {/* Metadata */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "9px" }}>
          <span>Bill No.: {bill.billNumber}</span>
          <span>Date: {dateStr}</span>
        </div>

        {/* Solid Separator */}
        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />

        {/* Column Headers */}
        <div style={{ fontWeight: "bold", fontSize: "9px", margin: "2px 0" }}>
          <div style={{ paddingLeft: "15px" }}>Product</div>
          <div style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 2fr 2fr 2fr 2.5fr", gap: "2px", textAlign: "right" }}>
            <span style={{ textAlign: "left" }}>Barcode</span>
            <span>GST %</span>
            <span>S.Rate</span>
            <span>Qty.</span>
            <span>Dis.</span>
            <span>Amount</span>
          </div>
        </div>

        {/* Solid Separator */}
        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />

        {/* Items Rows */}
        <div style={{ minHeight: "60px" }}>
          {bill.items?.map((item, index) => {
            const itemMrp = item.mrp || item.unitPrice;
            const discount = itemMrp > item.unitPrice ? (itemMrp - item.unitPrice) * item.quantity : 0;
            const amountVal = (item.unitPrice * item.quantity) / 100;
            
            return (
              <div key={item.id || index} style={{ borderBottom: "1px dotted #000", padding: "4px 0", fontWeight: "bold" }}>
                {/* Line 1: S.No + Product Name */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <span>{index + 1}</span>
                  <span>{item.productName}</span>
                </div>
                {/* Line 2: Details */}
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 2fr 2fr 2fr 2.5fr", gap: "2px", textAlign: "right", color: "#333", fontSize: "9px" }}>
                  <span style={{ textAlign: "left", color: "#000" }}>{item.barcode || "100" + (index + 1)}</span>
                  <span>{(taxRate).toFixed(2)}</span>
                  <span>{(itemMrp / 100).toFixed(2)}</span>
                  <span>{item.quantity.toFixed(2)}</span>
                  <span>{(discount / 100).toFixed(2)}</span>
                  <span style={{ color: "#000" }}>{amountVal.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Row */}
        <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", display: "flex", justifyContent: "space-between", fontWeight: "bold", padding: "4px 0" }}>
          <span>TOTAL:</span>
          <span>{totalQty.toFixed(2)}</span>
          <span>{(netPayable / 100).toFixed(2)}</span>
        </div>

        {/* Amount in words */}
        <div style={{ fontWeight: "bold", fontSize: "9px", textTransform: "uppercase", marginTop: "4px", marginBottom: "6px" }}>
          Rs.: {numberToIndianWords(netPayable / 100)}
        </div>

        {/* Tender Box */}
        <div style={{ border: "1px solid #000", padding: "6px 8px", borderRadius: "2px", margin: "4px 0 6px 0", fontWeight: "bold" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cash</span>
            <span>{(netPayable / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "3px 0" }}>
            <span>Tender Amount:</span>
            <span>{(netPayable / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Balance refund:</span>
            <span>0.00</span>
          </div>
        </div>

        {/* Pricing Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontWeight: "bold", fontSize: "9px", padding: "2px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total Sale:</span>
            <span>{(totalSale / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "900" }}>
            <span>Net Payable:</span>
            <span>{(netPayable / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* GST Details Box */}
        <div style={{ border: "1.5px solid #000", marginTop: "6px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", fontWeight: "bold", textAlign: "center" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ borderRight: "1px solid #000", color: "#a52a2a", padding: "3px 0" }}>Taxable Am</th>
                <th style={{ borderRight: "1px solid #000", color: "#a52a2a", padding: "3px 0" }}>CGST</th>
                <th style={{ borderRight: "1px solid #000", color: "#a52a2a", padding: "3px 0" }}>SGST</th>
                <th style={{ color: "#a52a2a", padding: "3px 0" }}>Total GST</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderRight: "1px solid #000", padding: "4px 0" }}>{(taxableAm / 100).toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #000", padding: "4px 0" }}>{(cgst / 100).toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #000", padding: "4px 0" }}>{(sgst / 100).toFixed(2)}</td>
                <td style={{ padding: "4px 0" }}>{(totalGst / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms & Conditions */}
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "9px", fontWeight: "bold", color: "#b22222" }}>Terms & Conditions:-</div>
          <div style={{ fontSize: "8px", fontWeight: "normal", color: "#444", textAlign: "justify", marginTop: "2px", lineHeight: "1.2" }}>
            {shop?.footerText || (
              "Creating terms and conditions for your website is essential for setting the \"house\" rules, legal protection, managing user conduct, and much more. Customizing terms and conditions according to your specific needs and requirements helps address potential risks and liabilities."
            )}
          </div>
        </div>

        {/* Barcode */}
        <div style={{ margin: "14px 0 6px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Code39Barcode value={bill.billNumber} />
        </div>

        {/* Footer closing line */}
        <div style={{ textAlign: "center", fontSize: "9px", fontWeight: "bold", marginTop: "4px" }}>
          Thank you for Shopping & Visit Again..!
        </div>
      </div>
    </>
  );
}
