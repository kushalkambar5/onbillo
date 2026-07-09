import NoShopLayout from "../components/NoShopLayout";

export default function InvitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NoShopLayout>{children}</NoShopLayout>;
}
