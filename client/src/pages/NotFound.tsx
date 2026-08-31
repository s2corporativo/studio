import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0c1715] px-4 text-[#f3ebdd]">
      <Card className="w-full max-w-lg border-[#daba7d]/15 bg-[#12221e] shadow-none">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#c99550]/15" />
              <AlertCircle className="relative h-16 w-16 text-[#e2ba7c]" />
            </div>
          </div>

          <h1 className="mb-2 font-serif text-4xl font-bold text-[#f3ebdd]">404</h1>

          <h2 className="mb-4 text-xl font-semibold text-[#eee5d7]">
            Página não encontrada
          </h2>

          <p className="mb-8 leading-relaxed text-[#9aa89f]">
            A rota solicitada não existe ou foi movida.
            <br />
            Retorne ao Social Studio para continuar a operação.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button
              onClick={handleGoHome}
              className="bg-[#c99550] px-6 py-2.5 text-[#14221e] hover:bg-[#ddb06b]"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
