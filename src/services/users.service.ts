import { adminFetch } from "@/services/http"

export interface UserProfile {
  id_usuario: number
  auth_user_id: string
  email: string
  nombre: string
  apellido: string
  foto_url: string | null
  activo: boolean
  estado: string
  fecha_creacion: string
  roles: string[]
}

export type UserPerfil =
  | {
      tipo: "paciente"
      id_paciente: number
      fecha_nacimiento: string
      sexo_biologico: string
    }
  | {
      tipo: "nutricionista"
      id_nutricionista: number
      matricula: string
      estado_matricula: string | null
    }
  | { tipo: "administrador"; id_administrador: number }
  | null

export interface UserDetail extends UserProfile {
  perfil: UserPerfil
}

interface ListaUsuariosResponse {
  usuarios: UserProfile[]
}

export const usersService = {
  async list(): Promise<UserProfile[]> {
    const { usuarios } = await adminFetch<ListaUsuariosResponse>(
      "/administradores/usuarios"
    )
    return usuarios
  },

  async getDetail(idUsuario: number): Promise<UserDetail> {
    return adminFetch<UserDetail>(`/administradores/usuarios/${idUsuario}`)
  },

  async setBlocked(idUsuario: number, blocked: boolean): Promise<void> {
    await adminFetch(`/administradores/usuarios/${idUsuario}/estado`, {
      method: "PATCH",
      body: { activo: !blocked },
    })
  },
}
