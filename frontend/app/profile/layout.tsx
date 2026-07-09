import NoShopLayout from "../components/NoShopLayout";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NoShopLayout>{children}</NoShopLayout>;
}
