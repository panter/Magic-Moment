import { getCurrentUser } from "@/app/actions/auth";
import LoginForm from "@/components/login-form";
export const dynamic = "force-dynamic";
export const revalidate = 0; // disable ISR
export const fetchCache = "force-no-store";
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
