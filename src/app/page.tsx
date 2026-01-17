import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Map as MapIcon, Shield, TreePine } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Verify Session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isRanger = profile?.role === 'ranger'

  // 3. Server Action for Logout
  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            {isRanger ? <Shield className="text-orange-500" /> : <TreePine className="text-emerald-500" />}
            <span className="font-bold tracking-tight">CanopyCheck</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              Welcome, {profile?.username || user.email}
            </span>
            <form action={signOut}>
              <button className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium hover:bg-zinc-700">
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold">Mission Control</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {isRanger
                ? "Monitor incoming threats and verify scout reports."
                : "Log your findings and explore the forest map."}
            </p>
            <div className="mt-6 flex gap-3">
              <a href="/map" className="flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
                <MapIcon className="h-4 w-4" />
                Open Map
              </a>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold">Your Status</h3>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">Role</dt>
                <dd className={`text-sm font-medium ${isRanger ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {profile?.role?.toUpperCase() || 'SCOUT'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">XP Points</dt>
                <dd className="text-sm font-medium text-white">{profile?.xp_points || 0}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Helper for Team */}
        <div className="mt-12 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-200">
          <p className="text-xs font-mono">
            🚧 <strong>Team Note:</strong> This is the Dashboard (src/app/page.tsx).
            Person 3 & 4 should link their features (Map, Camera) here.
          </p>
        </div>
      </main>
    </div>
  )
}
