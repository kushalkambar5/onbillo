CREATE TYPE "public"."bill_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('rupees');--> statement-breakpoint
CREATE TYPE "public"."invoice_templet" AS ENUM('1', '2', '3', '4', '5');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."shop_member_role" AS ENUM('owner', 'shop_worker');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('gst_inclusive', 'gst_exclusive', 'no_tax');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('app_admin', 'user');--> statement-breakpoint
CREATE TABLE "bill_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"shop_product_id" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"bill_number" varchar(100) NOT NULL,
	"created_by" integer NOT NULL,
	"total_price" integer NOT NULL,
	"notes" text,
	"templet_used" "invoice_templet" DEFAULT '1' NOT NULL,
	"status" "bill_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_invoice" UNIQUE("shop_id","bill_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode" varchar(255),
	"name" varchar(255) NOT NULL,
	"brand" varchar(255),
	"category" varchar(255),
	"image_url" text,
	"mrp" integer NOT NULL,
	"status" "product_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "shop_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "shop_member_role" DEFAULT 'shop_worker' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"gst_number" varchar(50),
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(20) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"logo_url" text,
	"currency" "currency" DEFAULT 'rupees' NOT NULL,
	"tax_type" "tax_type" DEFAULT 'no_tax' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"invoice_templet" "invoice_templet" DEFAULT '1' NOT NULL,
	"invoice_prefix" varchar(20) DEFAULT 'INV/' NOT NULL,
	"invoice_counter" integer DEFAULT 1 NOT NULL,
	"footer_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"requested_to" integer NOT NULL,
	"role" "shop_member_role" DEFAULT 'shop_worker' NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_requested_to" UNIQUE("shop_id","requested_to")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_requested_to_users_id_fk" FOREIGN KEY ("requested_to") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "bills" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bills_shop_id_idx" ON "bills" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "barcode_idx" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "shop_product_idx" ON "shop_products" USING btree ("shop_id","product_id");--> statement-breakpoint
CREATE INDEX "requested_to_idx" ON "staff_requests" USING btree ("requested_to");