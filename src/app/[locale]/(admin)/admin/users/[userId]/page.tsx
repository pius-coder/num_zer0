import { db } from '@/database'
import {
  user,
  creditWallet,
  creditPurchase,
  smsActivation,
  supportMessages,
  service
} from '@/database/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { AdminPageShell } from '../../_components/admin-page-shell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PhoneCall,
  Calendar,
  Wallet,
  Ban,
  CheckCircle2,
  History,
  MessageCircle,
  CreditCard,
  Phone,
  User as UserIcon
} from 'lucide-react'

// Helper to format currency
const formatCredits = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount) + ' cr'

export default async function AdminUserDetailsPage({
  params
}: {
  params: Promise<{ locale: string; userId: string }>
}) {
  const { userId, locale } = await params

  // Fetch basic user data
  const [userData] = await db.select().from(user).where(eq(user.id, userId))

  if (!userData) {
    notFound()
  }

  // Fetch wallet data
  const [wallet] = await db.select().from(creditWallet).where(eq(creditWallet.userId, userId))

  // Fetch recent purchases
  const recentPurchases = await db
    .select()
    .from(creditPurchase)
    .where(eq(creditPurchase.userId, userId))
    .orderBy(desc(creditPurchase.createdAt))
    .limit(10)

  // Fetch recent SMS activations (rentals)
  const recentActivations = await db
    .select({
      activation: smsActivation,
      serviceNameFr: service.nameFr,
      serviceNameEn: service.nameEn
    })
    .from(smsActivation)
    .leftJoin(service, eq(smsActivation.serviceId, service.id))
    .where(eq(smsActivation.userId, userId))
    .orderBy(desc(smsActivation.createdAt))
    .limit(10)

  // Fetch recent support messages
  const recentMessages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.userId, userId))
    .orderBy(desc(supportMessages.createdAt))
    .limit(10)

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  return (
    <AdminPageShell
      title="Détails de l'utilisateur"
      subtitle="Visualisation détaillée du profil, du solde et de l'historique"
    >
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-6 bg-card rounded-xl border shadow-sm">
        <Avatar className="h-20 w-20 rounded-2xl shadow-sm border-2 border-primary/10">
          <AvatarImage src={userData.image || undefined} alt={userData.name} />
          <AvatarFallback className="rounded-2xl bg-primary/5 text-primary text-2xl font-semibold">
            {getInitials(userData.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{userData.name}</h2>
              <p className="text-muted-foreground">{userData.email || 'Aucun email généré'}</p>
            </div>
            {userData.banned ? (
              <Badge variant="destructive" className="px-3 py-1 gap-1">
                <Ban className="h-3.5 w-3.5" /> Compte Banni
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20 px-3 py-1 gap-1 border-none">
                <CheckCircle2 className="h-3.5 w-3.5" /> Compte Actif
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {userData.phoneNumber || 'Aucun numéro'}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Inscrit le {new Date(userData.createdAt).toLocaleDateString('fr-FR')}
            </div>
            {userData.username && (
              <div className="flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" />
                @{userData.displayUsername || userData.username}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="rentals">
            Locations 
            <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/20">{recentActivations.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="purchases">Achats</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Wallet Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" /> Portefeuille
                    </CardTitle>
                    <CardDescription>Solde actuel de l'utilisateur</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold tracking-tight text-primary">
                    {wallet ? formatCredits(wallet.baseBalance + wallet.bonusBalance + wallet.promoBalance) : '0 cr'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm pt-4 border-t">
                    <div className="space-y-1">
                      <p className="text-muted-foreground capitalize">Base</p>
                      <p className="font-semibold">{wallet ? formatCredits(wallet.baseBalance) : '0 cr'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground capitalize">Bonus</p>
                      <p className="font-semibold">{wallet ? formatCredits(wallet.bonusBalance) : '0 cr'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground capitalize">Promo</p>
                      <p className="font-semibold">{wallet ? formatCredits(wallet.promoBalance) : '0 cr'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

               {/* Stats Card */}
               <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" /> Statistiques Globales
                    </CardTitle>
                    <CardDescription>Consommation et historique</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Acheté</p>
                      <p className="text-lg font-semibold">{wallet ? formatCredits(wallet.totalPurchased) : '0 cr'}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Consommé</p>
                      <p className="text-lg font-semibold">{wallet ? formatCredits(wallet.totalConsumed) : '0 cr'}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Remboursé</p>
                      <p className="text-lg font-semibold">{wallet ? formatCredits(wallet.totalRefunded) : '0 cr'}</p>
                    </div>
                     <div className="bg-muted/50 p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Bonus Reçus</p>
                      <p className="text-lg font-semibold">{wallet ? formatCredits(wallet.totalBonusReceived) : '0 cr'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rentals">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> Historique des Locations SMS
                </CardTitle>
                <CardDescription>Les 10 dernières activations de numéro</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Coût</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                          Aucune location récente
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentActivations.map((item) => (
                        <TableRow key={item.activation.id}>
                          <TableCell className="font-medium">{item.serviceNameFr || 'Inconnu'}</TableCell>
                          <TableCell>{item.activation.phoneNumber ? `+${item.activation.phoneNumber}` : 'En attente'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              item.activation.state === 'completed' ? 'default' :
                              item.activation.state === 'cancelled' || item.activation.state === 'expired' ? 'destructive' :
                              'secondary'
                            }>
                              {item.activation.state}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCredits(item.activation.creditsCharged)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(item.activation.createdAt).toLocaleDateString('fr-FR')} à {new Date(item.activation.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Historique des Achats
                </CardTitle>
                <CardDescription>Les 10 derniers rechargements de crédits</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Montant F CFA</TableHead>
                      <TableHead>Crédits (Base + Bonus)</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPurchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                          Aucun achat récent
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">{purchase.priceXaf.toLocaleString()} XAF</TableCell>
                          <TableCell>
                            {purchase.totalCredits} cr <span className="text-muted-foreground text-xs">({purchase.creditsBase} + {purchase.creditsBonus})</span>
                          </TableCell>
                          <TableCell className="capitalize">{purchase.paymentMethod.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge variant={
                              purchase.status === 'credited' ? 'default' :
                              purchase.status === 'failed' ? 'destructive' : 'secondary'
                            }>
                              {purchase.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(purchase.createdAt).toLocaleDateString('fr-FR')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" /> Historique du Support
                </CardTitle>
                <CardDescription>Les 10 derniers messages échangés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">
                      Aucun message de support
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {recentMessages.map((msg) => (
                        <div key={msg.id} className={`p-4 rounded-xl text-sm ${msg.direction === 'admin_to_user' ? 'bg-primary/10 ml-8 border border-primary/20' : 'bg-muted mr-8 border'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                              {msg.direction === 'admin_to_user' ? 'Administrateur' : userData.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </AdminPageShell>
  )
}
