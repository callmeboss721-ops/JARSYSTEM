import { Welcome } from "@/components/brand/welcome";

type LoginPageProps = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { mode } = await searchParams;
  return <Welcome initialTab={mode === "register" ? "register" : "login"} />;
}
