"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "Can this make billing faster?",
    answer: "Yes. Simply scan a product barcode, adjust the quantity if needed, and generate the bill in seconds. No repetitive typing or searching through long product lists."
  },
  {
    question: "Will I lose my existing data?",
    answer: "No. Your data is stored securely and regularly backed up."
  },
  {
    question: "Is it easy to learn?",
    answer: "Yes. Onbillo is designed for shop owners and staff with minimal training. Most users can start billing within minutes."
  },
  {
    question: "Does it work offline?",
    answer: "Yes. Internet interruptions won't stop your business. Continue billing offline, and your data will sync automatically when the connection is restored."
  },
  {
    question: "Can my workers use it?",
    answer: "Yes. Create separate accounts for your employees and assign roles such as Owner, Manager, or Cashier with different permissions."
  },
  {
    question: "Is it GST compliant?",
    answer: "Yes. Generate GST-ready invoices with automatic tax calculations and maintain accurate billing records."
  }
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {FAQ_DATA.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="rounded-xl border border-hairline bg-canvas transition-colors duration-200"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between p-5 text-left font-medium text-foreground text-sm hover:text-brand-primary outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 rounded-xl cursor-pointer"
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={`w-4 h-4 text-mute transition-transform duration-200 ${
                  isOpen ? "transform rotate-180 text-brand-primary" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? "max-h-40 border-t border-hairline" : "max-h-0"
              }`}
            >
              <p className="p-5 text-xs text-body leading-relaxed bg-canvas-soft">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
