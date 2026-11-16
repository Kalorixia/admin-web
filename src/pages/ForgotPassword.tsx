import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PasswordInput from "@/components/PasswordInput"
import { authService } from "@/services/authService"

function validarPasswordNueva(
  password: string,
  confirmacion: string
): string | null {
  if (password.length < 8)
    return "La contraseña debe tener al menos 8 caracteres"
  if (password.length > 72)
    return "La contraseña debe tener como máximo 72 caracteres"
  if (!/[A-Za-z]/.test(password))
    return "La contraseña debe incluir al menos una letra"
  if (!/\d/.test(password))
    return "La contraseña debe incluir al menos un número"
  if (password !== confirmacion) return "Las contraseñas no coinciden"
  return null
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState<"email" | "codigo">("email")
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleEnviar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const res = await authService.forgotPassword(email)
      setInfo(res.message)
      setPaso("codigo")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el código"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReenviar = async () => {
    if (!email) {
      setError("Ingresá tu email para reenviar el código")
      return
    }
    setError(null)
    setInfo(null)
    setResending(true)
    try {
      const res = await authService.forgotPassword(email)
      setInfo(res.message)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo reenviar el código"
      )
    } finally {
      setResending(false)
    }
  }

  const handleCambiar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    if (codigo.length !== 6) {
      setError("El código tiene 6 dígitos")
      return
    }
    const invalida = validarPasswordNueva(password, confirmacion)
    if (invalida) {
      setError(invalida)
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(email, codigo, password, confirmacion)
      toast.success("Contraseña actualizada. Ingresá con tu nueva contraseña.")
      navigate("/login", { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar la contraseña"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4">
      <div className="card-shadow w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {paso === "email"
              ? "Ingresá tu email y te enviamos un código de 6 dígitos."
              : "Ingresá el código que te enviamos y tu nueva contraseña."}
          </p>
        </div>

        {paso === "email" ? (
          <form onSubmit={handleEnviar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Enviar código
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCambiar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código de verificación</Label>
              <Input
                id="codigo"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-[0.5em]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña nueva</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmacion">Repetir contraseña</Label>
              <PasswordInput
                id="confirmacion"
                autoComplete="new-password"
                required
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-primary">{info}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Cambiar contraseña
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={resending}
              onClick={handleReenviar}
              className="w-full"
            >
              {resending && <Loader2 className="size-4 animate-spin" />}
              Reenviar código
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
