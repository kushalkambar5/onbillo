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
    <div className="max-w-3xl mx-auto rounded-2xl border border-black/10 bg-white overflow-hidden dark:border-white/10 dark:bg-[#121212]">
      {FAQ_DATA.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border-b border-black/10 last:border-b-0 dark:border-white/10"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left outline-none focus-visible:bg-black/[0.03] dark:focus-visible:bg-white/[0.04] cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="text-[14px] sm:text-[15px] font-bold text-foreground dark:text-white leading-snug">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-mute dark:text-white/70 transition-transform duration-200 ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 sm:px-6 pb-5 text-sm text-body dark:text-white/60 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
