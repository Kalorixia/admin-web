import { apiFetch } from "@/services/http"

export interface SessionResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  requires_password_change: boolean
}

export interface AdminPerfil {
  tipo: "administrador"
  id_administrador: number
  debe_cambiar_password: boolean
}

export interface OtroPerfil {
  tipo: "nutricionista" | "paciente"
  [key: string]: unknown
}

export interface UsuarioActual {
  id_usuario: number
  auth_user_id: string
  email: string
  nombre: string
  apellido: string
  foto_url: string | null
  activo: boolean
  estado: string
  roles: string[]
  perfil: AdminPerfil | OtroPerfil | null
}

export const authService = {
  login(email: string, password: string) {
    return apiFetch<SessionResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
  },

  refresh(refreshToken: string) {
    return apiFetch<SessionResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
    })
  },

  logout(accessToken: string) {
    return apiFetch<void>("/auth/logout", {
      method: "POST",
      token: accessToken,
    })
  },

  changePassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string
  ) {
    return apiFetch<{ message: string }>("/auth/change-password", {
      method: "POST",
      token: accessToken,
      body: { current_password: currentPassword, new_password: newPassword },
    })
  },

  me(accessToken: string) {
    return apiFetch<UsuarioActual>("/auth/me", {
      method: "GET",
      token: accessToken,
    })
  },
}
