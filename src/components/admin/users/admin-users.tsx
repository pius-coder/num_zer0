import { useAdminUsers, useDeleteUser } from '../hooks/use-admin-queries'
import { Badge } from '#/common/ui/badge'
import { Button } from '#/common/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers()
  const deleteUser = useDeleteUser()

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  const handleDelete = (userId: string, name: string) => {
    if (window.confirm(`Supprimer l'utilisateur "${name}" ?`)) {
      deleteUser.mutate({ userId: userId as any })
    }
  }

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom / Email</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Pays</TableHead>
            <TableHead>Dépôt</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u: any) => (
            <TableRow key={u._id}>
              <TableCell>
                <div className="font-figtree">{u.name ?? '—'}</div>
                <div className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{u.email ?? ''}</div>
              </TableCell>
              <TableCell>
                <Badge variant={u.isAnonymous ? 'warning' : 'success'}>
                  {u.isAnonymous ? 'Temporaire' : 'Permanent'}
                </Badge>
              </TableCell>
              <TableCell className="font-figtree">{u._creationTime ? formatDate(u._creationTime) : '—'}</TableCell>
              <TableCell className="font-figtree">{u.country ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={u.hasMadeDeposit ? 'success' : 'secondary'}>
                  {u.hasMadeDeposit ? 'Effectué' : 'En attente'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(u._id, u.name ?? u.email)}>
                  Suppr.
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
