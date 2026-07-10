# Onbillo — Next-Gen Billing & POS for Indian Retail

Onbillo is a multi-platform billing & POS system for Indian retail shops (kirana stores, restaurants, wholesale dealers, supermarkets, and boutiques). It combines barcode scanning, thermal printing, GST compliance, role-based access, cloud sync with offline-first resilience, and a community-powered global product database.

---

## Core Capabilities

### 1. Interactive POS Billing & Checkout
Scan barcodes or search products to build a cart in real-time. Manage quantities, apply custom transaction notes, and finalize checkouts instantly.
- **Key Features:** Fast cart modification, search by name/brand/barcode, custom transaction notes, and instant checkout.
- **Benefits:** Faster checkout times, error-free cashier entry, and higher customer throughput.

### 2. Camera & Hardware Barcode Scanning
Integrated camera-based scanning via WebAssembly (`zxing_reader.wasm`) and `react-zxing` with flash/torch control and camera facing mode toggle (user/environment). Seamlessly works with external hardware barcode scanners.
- **Key Features:** Responsive camera feed, automatic product lookup, torch support, and scan beep feedback.
- **Benefits:** Eliminates expensive hardware requirements; turns any phone or tablet into a scanner.

### 3. Dynamic GST Compliance
Automatic, precise GST calculation at checkout. Configure tax preferences globally or at the shop level.
- **Key Features:** Inclusive GST, Exclusive GST, and No Tax modes. Custom tax rates (e.g., 5%, 12%, 18%, 28%) applied dynamically.
- **Benefits:** Guaranteed tax compliance, automated calculation in paise to prevent rounding errors, and simplified tax filing.

### 4. Thermal Printer Support
Generate and print professional receipts formatted for standard 3″ (380px width) thermal receipt printers. Compatible with USB and Bluetooth POS printers.
- **Key Features:** Standardized print-ready stylesheets (`@media print`), customized shop header (GSTIN, address, phone), bill metadata, cashier tracking, and footer messages.
- **Benefits:** One-click receipt generation, fits standard POS printers, and provides immediate physical proof of purchase.

### 5. Sales Dashboard & Reports
Track store metrics via a centralized owner dashboard. Monitor business health and spot trends with visual analytics.
- **Key Features:** KPI cards for Total Revenue (in Rupees), Total Bills, and Average Order Value (AOV). Dynamic "Sales Over Time" charts, Top-Selling Products list, Busiest Hours distribution, and cashier performance data.
- **Benefits:** Real-time visibility into shop operations, smart purchasing based on sales trends, and employee productivity tracking.

### 6. Shop Inventory Management
Full control over your catalog. Maintain unit prices, product active states, and update inventory details easily.
- **Key Features:** Catalog browsing, search filters, manual product creation, and global database linking.
- **Benefits:** Accurate stock pricing, simplified catalog updates, and zero double-entry.

### 7. Staff Management & Role-Based Access
Collaborate with your team safely. Delegate tasks while keeping sensitive financial data restricted to owners.
- **Key Features:** Role-based access control (Owner vs. Shop Worker/Cashier). Staff invitation system (invite via email; accept/reject invites from the user onboarding workspace).
- **Benefits:** Owner-only access to dashboard reports and settings, cashier-friendly billing interface, and secure multi-user management.

### 8. Multi-Shop Support & Configurable Settings
Run multiple retail locations under a single account. Customize settings for each shop independently.
- **Key Features:** Easy shop switcher. Custom invoice prefixes, custom receipt headers/footers, GSTIN configuration, and starting invoice counter numbers.
- **Benefits:** Centralized business management, localized branding, and seamless multi-branch scaling.

### 9. Platform Admin Console
Dedicated admin module for platform administrators to moderate the system and maintain data quality.
- **Key Features:** Platform stats (total users, shops, products), User management (list and ban/unban controls), Shop management (active/block status), and Global DB Moderation (review, approve, or reject user-suggested products with custom rejection reasons).
- **Benefits:** Automated curation of the global database, spam control, and platform-wide monitoring.

### 10. Offline Resilience & Cloud Sync
Continue billing and managing operations even when the internet goes out.
- **Key Features:** Offline-first design, local persistence, and automatic background synchronization to the cloud when connection is restored.
- **Benefits:** Zero business downtime and data integrity protection across network outages.

---

## Global Barcode Database
Access a community-powered global product database containing thousands of retail SKUs.
- **How it works:** Scan a barcode of an unregistered product. If it exists in the global database, Onbillo automatically pulls its name, brand, category, MRP, and image, saving you from manual entry. If it doesn't, you can create it and suggest it to the global database for platform moderation.
- **Benefits:** Instant product onboarding, unified product naming, and community-driven expansion.

---

## Secure Onboarding & Authentication
- **Secure Auth:** Seamless login and sign-up powered by Clerk.
- **Phone Prefix Enforcement:** Forms enforce a fixed `+91` prefix and strictly validate a 10-digit Indian phone number for users and shops, ensuring authentic communication channels.

---

## Simple Setup in Four Steps
1. **Register & Onboard:** Sign up securely, select/create your shop, and verify your details (with fixed `+91` phone validation).
2. **Configure Settings:** Set your GSTIN, custom receipt templates, default tax rates (inclusive/exclusive), and billing prefixes.
3. **Build Inventory:** Scan barcodes to populate products automatically from the Global Database, or add custom products manually.
4. **Start Billing:** Scan barcodes using your mobile camera or hardware scanner, print thermal receipts, and view real-time sales reports on the owner dashboard.

---

## Frequently Asked Questions (FAQs)

- **Can this make billing faster?**
  Yes. Simply scan a product barcode (using a mobile camera or hardware scanner), adjust the quantity, and generate the bill in seconds.
- **Will I lose my data if I go offline?**
  No. Onbillo stores bills locally and syncs them automatically to the cloud once the network is restored.
- **Is it easy for my cashiers to learn?**
  Yes. Cashiers have access to a clean, simplified POS billing screen, inventory browser, and bill history page with no distraction from dashboard analytics or shop settings.
- **Can I manage multiple shops?**
  Yes. You can create multiple shops and switch between them instantly from the workspace sidebar.
- **What is the Global Product Database?**
  A shared product library. When you scan an item not yet in your shop, Onbillo checks the global database. If found, it automatically fills the product details (name, brand, MRP) to save you setup time.
- **Does it support thermal receipt printing?**
  Yes. All bills can be printed directly using 3″ (380px) Bluetooth or USB thermal receipt printers.
- **What tax configurations does it support?**
  It supports GST Inclusive, GST Exclusive, and No Tax modes. The GST tax rate is customizable per shop.
- **How does staff permission work?**
  Owners have access to all features (including dashboard metrics, staff invites, and settings). Invited staff members are assigned the `shop_worker` role, restricting them to POS billing, bill history, and product browsing.
- **Is there an Admin Console?**
  Yes. App administrators have a dedicated `/admin` workspace to manage users, shops, and approve/reject pending global database product requests.
