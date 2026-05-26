import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@/aura/client/hooks";
import { Button } from "@/aura/ui/button";
import { Input } from "@/aura/ui/input";
import { Label } from "@/aura/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/aura/ui/card";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("+221");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const register = useMutation("auth.register", {
    onSuccess: () => navigate({ to: "/" }),
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Inscription</CardTitle>
          <CardDescription>Créez un compte avec votre téléphone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password !== confirm) return;
              register.mutate({ countryCode, phoneNumber, password });
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
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            {password !== confirm && confirm && (
              <p className="text-sm text-destructive">Les mots de passe ne correspondent pas.</p>
            )}
            {register.isError && (
              <p className="text-sm text-destructive">{register.error?.message ?? "Erreur d'inscription."}</p>
            )}
            <Button type="submit" className="w-full" disabled={register.isPending || password !== confirm}>
              {register.isPending ? "Inscription..." : "Créer un compte"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="underline underline-offset-2 hover:text-foreground">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
