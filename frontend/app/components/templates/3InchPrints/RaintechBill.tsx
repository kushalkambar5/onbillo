import React from "react";
import { Bill, Shop } from "../../../utils/api";

interface RaintechBillProps {
  bill: Bill;
  shop: Shop | null;
}

export default function RaintechBill({ bill, shop }: RaintechBillProps) {
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

  // Format rate to show integer if whole number, otherwise up to 2 decimal places
  const formatRate = (mrp: number | undefined, unitPrice: number): string => {
    const ratePaise = mrp !== undefined ? mrp : unitPrice;
    const rateRupees = ratePaise / 100;
    if (rateRupees % 1 === 0) {
      return rateRupees.toFixed(0);
    }
    return rateRupees.toFixed(2).replace(/\.00$/, "");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;900&display=swap');
        
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
          lineHeight: "1.4",
          border: "1.5px solid #4b5563",
          borderRadius: "24px",
          fontFamily: "'Noto Sans Devanagari', 'Inter', system-ui, sans-serif"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: "#0B3C9B",
              margin: "0 0 2px 0",
              letterSpacing: "0.5px"
            }}
          >
            {shop?.name || "RAINTECH SOFTWARE LTD"}
          </h1>
          <p
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              margin: "0 0 6px 0",
              color: "#000"
            }}
          >
            {shop?.addressLine1 || "Elangkavu, vadayar, vaikom"}
            {shop?.addressLine2 ? `, ${shop.addressLine2}` : ""}
          </p>
          <div
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              color: "#000",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              alignItems: "center"
            }}
          >
            <span>संपर्क : {shop?.phone ? shop.phone.replace("+91", "").trim() : "8078311945"}</span>
            <span>जी.एस.टी.आई.एन. : {shop?.gstNumber || ""}</span>
          </div>
        </div>

        {/* Separator Line */}
        <div style={{ borderTop: "1.2px solid #000", margin: "6px 0" }}></div>

        {/* Bill Metadata Details */}
        <div style={{ fontSize: "10px", fontWeight: "bold", padding: "0 2px" }}>
          {/* Row 1: Invoice No & Date */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <div>
              <span style={{ color: "#8B1E0F" }}>चालान नंबर:</span>{" "}
              <span style={{ color: "#000" }}>{bill.billNumber}</span>
            </div>
            <div>
              <span style={{ color: "#8B1E0F" }}>तारीख</span>{" "}
              <span style={{ color: "#000" }}>{dateStr}</span>
            </div>
          </div>
          {/* Row 2: Customer Name */}
          <div style={{ marginBottom: "4px" }}>
            <span style={{ color: "#8B1E0F" }}>ग्राहक का नाम :</span>{" "}
            <span style={{ color: "#000" }}>Cash</span>
          </div>
          {/* Row 3: Contact */}
          <div style={{ marginBottom: "6px" }}>
            <span style={{ color: "#8B1E0F" }}>संपर्क:</span>{" "}
            <span style={{ color: "#000" }}>1234567890</span>
          </div>
        </div>

        {/* Main Items Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1.5px solid #000",
            fontSize: "11px",
            fontWeight: "bold",
            textAlign: "center"
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1.5px solid #000",
                color: "#0B3C9B"
              }}
            >
              <th
                style={{
                  borderRight: "1px solid #000",
                  padding: "6px 4px",
                  width: "40%",
                  backgroundColor: "#f3f4f6"
                }}
              >
                उत्पाद
              </th>
              <th
                style={{
                  borderRight: "1px solid #000",
                  padding: "6px 4px",
                  width: "20%"
                }}
              >
                दर
              </th>
              <th
                style={{
                  borderRight: "1px solid #000",
                  padding: "6px 4px",
                  width: "15%",
                  backgroundColor: "#f3f4f6"
                }}
              >
                मात्रा
              </th>
              <th
                style={{
                  padding: "6px 4px",
                  width: "25%"
                }}
              >
                कुल राशि
              </th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, index) => {
              const isLast = bill.items ? index === bill.items.length - 1 : false;
              const rateStr = formatRate(item.mrp, item.unitPrice);
              const amountStr = ((item.unitPrice * item.quantity) / 100).toFixed(2);

              return (
                <tr
                  key={item.id || index}
                  style={{
                    borderBottom: isLast ? "none" : "1.5px dotted #000"
                  }}
                >
                  <td
                    style={{
                      borderRight: "1px solid #000",
                      padding: "6px 4px",
                      textAlign: "center"
                    }}
                  >
                    {item.productName}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid #000",
                      padding: "6px 4px",
                      textAlign: "center"
                    }}
                  >
                    {rateStr}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid #000",
                      padding: "6px 4px",
                      textAlign: "center",
                      backgroundColor: "#f3f4f6"
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "6px 4px",
                      textAlign: "center"
                    }}
                  >
                    {amountStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary Area */}
        <div
          style={{
            display: "flex",
            width: "100%",
            borderLeft: "1.5px solid #000",
            borderRight: "1.5px solid #000",
            borderBottom: "1.5px solid #000",
            fontSize: "11px",
            fontWeight: "bold"
          }}
        >
          {/* Left Column: Total Qty */}
          <div
            style={{
              width: "50%",
              padding: "8px 6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>कुल मात्रा.</span>
            <span style={{ marginRight: "10px" }}>{totalQty.toFixed(2)}</span>
          </div>

          {/* Right Column: Totals Box */}
          <div
            style={{
              width: "50%",
              borderLeft: "1.5px solid #000"
            }}
          >
            {/* Total Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 6px",
                borderBottom: "1px solid #000"
              }}
            >
              <span>कुल :</span>
              <span style={{ fontSize: "12px", fontWeight: "900" }}>
                {(grossTotal / 100).toFixed(2)}
              </span>
            </div>
            {/* Cash Paid Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 6px",
                borderBottom: "1px solid #000",
                fontSize: "10px"
              }}
            >
              <span style={{ fontWeight: "normal" }}>नकद निविदा</span>
              <span>{(grossTotal / 100).toFixed(2)}</span>
            </div>
            {/* Balance Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 6px",
                fontSize: "10px"
              }}
            >
              <span style={{ fontWeight: "normal" }}>संतुलन :</span>
              <span>0.00</span>
            </div>
          </div>
        </div>

        {/* Footer Thank You Pill */}
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "#e5e7eb",
            padding: "8px 12px",
            borderRadius: "9999px",
            textAlign: "center"
          }}
        >
          <span
            style={{
              color: "#0B3C9B",
              fontSize: "11px",
              fontWeight: "900"
            }}
          >
            धन्यवाद... पुनः पधारें!
          </span>
        </div>
      </div>
    </>
  );
}
