import { redirect } from "next/navigation";

type AdminCompatibilityRouteProps = {
  searchParams: Promise<{ desk?: string | string[] }>;
};

export default async function AdminCompatibilityRoute({ searchParams }: AdminCompatibilityRouteProps) {
  const { desk } = await searchParams;
  redirect(desk === "staff" ? "/staff" : "/owner");
}
