import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        {/* El texto de la página de inicio de sesión está dentro del componente LoginForm */}
        <LoginForm />
      </div>
    </main>
  );
}
