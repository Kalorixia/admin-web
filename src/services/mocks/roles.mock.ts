export type AppRole = "admin" | "nutricionista" | "paciente"

export interface Permission {
  code: string
  description: string | null
}

export const permissions: Permission[] = [
  { code: "users.view", description: "Ver usuarios" },
  { code: "users.block", description: "Bloquear/desbloquear usuarios" },
  { code: "recipes.publish", description: "Publicar recetas globales" },
  { code: "recipes.edit", description: "Editar recetas propias" },
  { code: "patients.manage", description: "Gestionar pacientes asignados" },
  {
    code: "subscriptions.manage",
    description: "Gestionar planes de suscripción",
  },
  { code: "audit.view", description: "Ver auditoría del sistema" },
]

export const rolePermissions: { role: AppRole; permission_code: string }[] = [
  { role: "admin", permission_code: "users.view" },
  { role: "admin", permission_code: "users.block" },
  { role: "admin", permission_code: "recipes.publish" },
  { role: "admin", permission_code: "subscriptions.manage" },
  { role: "admin", permission_code: "audit.view" },
  { role: "nutricionista", permission_code: "recipes.edit" },
  { role: "nutricionista", permission_code: "patients.manage" },
  { role: "paciente", permission_code: "recipes.edit" },
]
