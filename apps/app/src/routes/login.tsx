import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@/aura/client/hooks";
import { Button } from "@/aura/ui/button";
import { Input } from "@/aura/ui/input";
import { Label } from "@/aura/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/aura/ui/card";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("+221");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation("auth.login", {
    onSuccess: () => navigate({ to: "/" }),
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Connectez-vous avec votre téléphone et mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate({ countryCode, phoneNumber, password });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="countryCode">Indicatif</Label>
              <Input id="countryCode" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
              <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {login.isError && (
              <p className="text-sm text-destructive">{login.error?.message ?? "Erreur de connexion."}</p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/register" className="underline underline-offset-2 hover:text-foreground">
              Créer un compte
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
