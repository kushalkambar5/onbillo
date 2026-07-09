import React from "react";
import { Bill, Shop } from "../utils/api";

interface ThermalReceiptProps {
  bill: Bill;
  shop: Shop | null;
}

export default function ThermalReceipt({ bill, shop }: ThermalReceiptProps) {
  const receiptSubtotal = bill.totalPrice;
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
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
        className="flex-1 overflow-y-auto bg-white border border-hairline-strong/30 rounded-lg p-5 font-mono text-[10px] text-zinc-800 shadow-inner select-text select-all print:border-none print:shadow-none print:overflow-visible"
      >
        {/* Header */}
        <div className="text-center space-y-1 mb-4">
          <h3 className="font-bold text-sm text-black tracking-tight">{shop?.name}</h3>
          <p className="leading-normal text-zinc-600">
            {shop?.addressLine1}
            {shop?.addressLine2 && `, ${shop.addressLine2}`}
            <br />
            {shop?.city}, {shop?.state} - {shop?.pincode}
          </p>
          {shop?.phone && <p className="text-zinc-600">Tel: {shop.phone}</p>}
          {shop?.gstNumber && <p className="font-bold text-black">GSTIN: {shop.gstNumber}</p>}
        </div>

        {/* Bill metadata */}
        <div className="border-t border-dashed border-zinc-400 py-2 space-y-1 text-zinc-600">
          <div className="flex justify-between">
            <span>BILL NO:</span>
            <span className="font-bold text-black">{bill.billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE:</span>
            <span>{new Date(bill.createdAt).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>CASHIER:</span>
            <span>{bill.cashierName || "Standard Cashier"}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-t border-dashed border-zinc-400 pt-2 pb-1 text-black font-bold">
          <div className="grid grid-cols-12 gap-1 mb-1">
            <span className="col-span-6">ITEM DESCRIPTION</span>
            <span className="col-span-2 text-right">QTY</span>
            <span className="col-span-4 text-right">PRICE (RS)</span>
          </div>
        </div>
        
        <div className="border-b border-dashed border-zinc-400 pb-2 space-y-1.5 text-zinc-800">
          {bill.items?.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-1 leading-tight">
              <span className="col-span-6 truncate">{item.productName}</span>
              <span className="col-span-2 text-right">{item.quantity}</span>
              <span className="col-span-4 text-right">
                {((item.unitPrice * item.quantity) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-2.5 space-y-1.5 border-b border-dashed border-zinc-400 text-black">
          <div className="flex justify-between font-semibold">
            <span>SUBTOTAL:</span>
            <span>₹{(receiptSubtotal / 100).toFixed(2)}</span>
          </div>
          {shop?.taxType !== "no_tax" && (
            <div className="flex justify-between text-zinc-700">
              <span>GST ({taxRate}% {shop?.taxType === "gst_inclusive" ? "Incl" : "Excl"}):</span>
              <span>₹{(receiptTax / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-extrabold border-t border-dotted border-zinc-400 pt-1.5">
            <span>GRAND TOTAL:</span>
            <span>₹{(receiptGrandTotal / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 space-y-1 text-zinc-500">
          <p className="font-bold text-black uppercase tracking-wider">Thank You!</p>
          {shop?.footerText && <p className="leading-snug">{shop.footerText}</p>}
          <p className="text-[8px] mt-2">Powered by Onbillo App</p>
        </div>
      </div>
    </>
  );
}
