import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listUsers,
  createUser,
  updateUserPassword,
  updateUsername,
  setUserRole,
  deleteUser,
} from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, KeyRound, UserPlus, Users, Pencil } from "lucide-react";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  roles: string[];
};

export function AdminUsersDialog({
  currentUserId,
  trigger,
}: {
  currentUserId: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const updatePwd = useServerFn(updateUserPassword);
  const updateName = useServerFn(updateUsername);
  const setRole = useServerFn(setUserRole);
  const del = useServerFn(deleteUser);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await list();
      setUsers(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        data: {
          email: newEmail,
          username: newUsername,
          password: newPassword,
          role: newRole,
        },
      });
      toast.success("Usuário criado");
      setNewEmail("");
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
    }
  };

  const onChangeRole = async (userId: string, role: "admin" | "user") => {
    try {
      await setRole({ data: { userId, role } });
      toast.success("Permissão atualizada");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const onResetPassword = async (userId: string) => {
    const password = window.prompt("Nova senha (mín. 8 caracteres):");
    if (!password || password.length < 8) return;
    try {
      await updatePwd({ data: { userId, password } });
      toast.success("Senha atualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const onEditUsername = async (userId: string, current: string) => {
    const username = window.prompt("Novo nome de usuário:", current);
    if (!username || username.trim() === current) return;
    try {
      await updateName({ data: { userId, username: username.trim() } });
      toast.success("Usuário atualizado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const onDelete = async (userId: string, label: string) => {
    if (!window.confirm(`Remover ${label}?`)) return;
    try {
      await del({ data: { userId } });
      toast.success("Usuário removido");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full justify-start gap-2">
            <Users className="w-4 h-4" />
            Gerenciar usuários
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Usuários</DialogTitle>
        </DialogHeader>

        <form onSubmit={onCreate} className="space-y-3 border border-border rounded-md p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="w-4 h-4" />
            Criar novo usuário
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="nu">Usuário</Label>
              <Input
                id="nu"
                required
                minLength={3}
                maxLength={32}
                autoCapitalize="none"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ne">E-mail (recuperação)</Label>
              <Input
                id="ne"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="np">Senha</Label>
              <Input
                id="np"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Permissão</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" size="sm">Criar usuário</Button>
        </form>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!loading && users.map((u) => {
            const role = (u.roles[0] as "admin" | "user") ?? "user";
            const isSelf = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className="flex items-center gap-2 py-2 px-2 border-b border-border last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.username || "(sem usuário)"}
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Select
                  value={role}
                  onValueChange={(v) => onChangeRole(u.id, v as "admin" | "user")}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditUsername(u.id, u.username)}
                  aria-label="Editar usuário"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onResetPassword(u.id)}
                  aria-label="Redefinir senha"
                >
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(u.id, u.username || u.email)}
                  disabled={isSelf}
                  aria-label="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
