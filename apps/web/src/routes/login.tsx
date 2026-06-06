import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { apiClient } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const start = useMutation({
    mutationFn: apiClient.startAuth,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate({ to: "/" });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    start.mutate({ email, name });
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <div className="auth-brand">
          <img alt="Logo Acipg" src="/logo.png" width={150} height={150}></img>
          <h1 className="auth-title">Bolão ACIPG</h1>
          <p className="auth-subtitle">
            Entre para dar seus palpites na Copa 2026
          </p>
        </div>

        <form className="auth-card" onSubmit={submit}>
          <label className="field-label" htmlFor="name">
            Nome
          </label>
          <input
            className="text-field"
            id="name"
            placeholder="Seu nome"
            required
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <label className="field-label" htmlFor="email">
            E-mail
          </label>
          <input
            className="text-field"
            id="email"
            inputMode="email"
            placeholder="nome@exemplo.com"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            className="primary-button"
            disabled={start.isPending}
            type="submit"
          >
            {start.isPending ? "Entrando..." : "Entrar"}
          </button>
          {start.isError ? (
            <p className="form-error">Nao foi possivel concluir o login.</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
