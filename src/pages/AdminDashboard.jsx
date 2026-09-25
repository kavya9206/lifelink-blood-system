import { useEffect, useMemo, useState } from "react";
import { useApp, fmtDate } from "@/lib/store";
import { inventoryStatus, BLOOD_GROUPS } from "@/lib/types";
import { ConfirmDialog, Field, PageWrap, Pill, Reveal, StatCard, StatusPill, btnPrimary, btnSoft, inputCls, selectCls } from "@/components/clay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Building2, Droplet, Droplets, HeartPulse, Pencil, RotateCcw, Search, Siren, Trash2, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  isApiMode,
  apiListDonors, apiUpdateDonor, apiDeleteDonor,
  apiListInventory, apiAdjustInventory,
  apiListRequests, apiSetRequestStatus, apiDeleteRequest,
  apiListHospitals, apiUpdateHospital, apiDeleteHospital,
  apiListUsers, apiDeleteUser, apiStats,
} from "@/lib/api";
import { mapDonorRow, mapInventoryRow, mapRequestRow, mapHospitalRow, mapUserRow } from "@/lib/mappers";

const th = "px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground";
const td = "px-5 py-3.5";

export default function AdminDashboard() {
  const { data, totals, user, updateDonor, deleteDonor, setRequestStatus, deleteRequest, adjustInventory, updateHospital, deleteHospital, deleteUser, resetDemo } = useApp();

  const [tab, setTab] = useState("donors");
  const [q, setQ] = useState({ donors: "", inventory: "", requests: "", hospitals: "", users: "" });
  const [donorGroup, setDonorGroup] = useState("all");
  const [donorAvail, setDonorAvail] = useState("all");
  const [invStatusF, setInvStatusF] = useState("all");
  const [reqStatusF, setReqStatusF] = useState("all");
  const [confirm, setConfirm] = useState(null);
  const [editDonor, setEditDonor] = useState(null);
  const [editInv, setEditInv] = useState(null);
  const [editHosp, setEditHosp] = useState(null);

  // API state
  const [apiDonors, setApiDonors] = useState(null);
  const [apiInventory, setApiInventory] = useState(null);
  const [apiRequests, setApiRequests] = useState(null);
  const [apiHospitals, setApiHospitals] = useState(null);
  const [apiUsers, setApiUsers] = useState(null);
  const [apiStatTotals, setApiStatTotals] = useState(null);
  const [busy, setBusy] = useState(false);

  const isApi = isApiMode;

  const fetchDonors = async () => { if (!isApi) return; try { const r = await apiListDonors(); setApiDonors((r.donors ?? []).map(mapDonorRow)); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } };
  const fetchInventory = async () => { if (!isApi) return; try { const r = await apiListInventory(); setApiInventory((r.inventory ?? []).map(mapInventoryRow)); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } };
  const fetchRequests = async () => { if (!isApi) return; try { const r = await apiListRequests(); setApiRequests((r.requests ?? []).map(mapRequestRow)); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } };
  const fetchHospitals = async () => { if (!isApi) return; try { const r = await apiListHospitals(); setApiHospitals((r.hospitals ?? []).map(mapHospitalRow)); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } };
  const fetchUsers = async () => { if (!isApi) return; try { const r = await apiListUsers(); setApiUsers((r.users ?? []).map(mapUserRow)); } catch (e) { /* forbidden for non-admin — silent */ } };
  const fetchStats = async () => { if (!isApi) return; try { const s = await apiStats(); setApiStatTotals(s); } catch { /* silent */ } };

  // Initial load — each fetch resolves into state inside a .then() callback
  // (never synchronously in the effect body) so no render cascade occurs.
  useEffect(() => {
    if (!isApi) return;
    apiListDonors().then((r) => setApiDonors((r.donors ?? []).map(mapDonorRow))).catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    apiListInventory().then((r) => setApiInventory((r.inventory ?? []).map(mapInventoryRow))).catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    apiListRequests().then((r) => setApiRequests((r.requests ?? []).map(mapRequestRow))).catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    apiListHospitals().then((r) => setApiHospitals((r.hospitals ?? []).map(mapHospitalRow))).catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
    apiListUsers().then((r) => setApiUsers((r.users ?? []).map(mapUserRow))).catch(() => { /* forbidden for non-admin — silent */ });
    apiStats().then((s) => setApiStatTotals(s)).catch(() => { /* silent */ });
  }, []);

  const donorsSource = isApi && apiDonors ? apiDonors : data.donors;
  const inventorySource = isApi && apiInventory ? apiInventory : data.inventory;
  const requestsSource = isApi && apiRequests ? apiRequests : data.requests;
  const hospitalsSource = isApi && apiHospitals ? apiHospitals : data.hospitals;
  const usersSource = isApi && apiUsers ? apiUsers : data.users;

  const totalsDisplay = isApi && apiStatTotals ? {
    donors: apiStatTotals.donors,
    units: apiStatTotals.units,
    pendingRequests: apiStatTotals.pending_requests,
    emergencyRequests: apiStatTotals.emergency_requests,
    hospitals: apiStatTotals.hospitals,
  } : totals;
  const requestsLen = isApi && apiStatTotals ? apiStatTotals.total_requests : data.requests.length;

  const donors = useMemo(() => {
    const s = q.donors.toLowerCase();
    return donorsSource.filter((d) => (!s || `${d.name} ${d.city} ${d.bloodGroup} ${d.phone}`.toLowerCase().includes(s)) && (donorGroup === "all" || d.bloodGroup === donorGroup) && (donorAvail === "all" || String(d.available) === donorAvail));
  }, [donorsSource, q.donors, donorGroup, donorAvail]);

  const inventory = useMemo(() => {
    const s = q.inventory.toLowerCase();
    return inventorySource.filter((i) => (!s || `${i.facility} ${i.city} ${i.bloodGroup}`.toLowerCase().includes(s)) && (invStatusF === "all" || inventoryStatus(i) === invStatusF));
  }, [inventorySource, q.inventory, invStatusF]);

  const requests = useMemo(() => {
    const s = q.requests.toLowerCase();
    return requestsSource.filter((r) => (!s || `${r.patientName} ${r.hospitalName} ${r.hospitalCity} ${r.bloodGroup}`.toLowerCase().includes(s)) && (reqStatusF === "all" || r.status === reqStatusF));
  }, [requestsSource, q.requests, reqStatusF]);

  const hospitals = useMemo(() => {
    const s = q.hospitals.toLowerCase();
    return hospitalsSource.filter((h) => !s || `${h.name} ${h.city} ${h.phone}`.toLowerCase().includes(s));
  }, [hospitalsSource, q.hospitals]);

  const users = useMemo(() => {
    const s = q.users.toLowerCase();
    return usersSource.filter((u) => !s || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(s));
  }, [usersSource, q.users]);

  const handleDeleteDonor = async (id) => {
    if (isApi) {
      setBusy(true);
      try { await apiDeleteDonor(id); toast.success("Donor removed from Supabase."); await fetchDonors(); fetchStats(); }
      catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
      return;
    }
    deleteDonor(id); toast.success("Donor removed.");
  };
  const handleToggleDonor = async (id, v) => {
    if (isApi) {
      try { await apiUpdateDonor(id, { available: v }); setApiDonors((prev) => prev ? prev.map((d) => d.id === id ? { ...d, available: v } : d) : prev); }
      catch (e) { toast.error(e instanceof Error ? e.message : String(e)); return; }
    }
    updateDonor(id, { available: v });
  };
  const handleRequestStatus = async (id, status) => {
    if (isApi) {
      try { await apiSetRequestStatus(id, status); toast.success(status === "fulfilled" ? "Fulfilled — inventory updated in Supabase." : `Request ${status}.`); await fetchRequests(); await fetchInventory(); fetchStats(); }
      catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
      return;
    }
    setRequestStatus(id, status); toast.success(status === "fulfilled" ? "Fulfilled — inventory updated." : `Request ${status}.`);
  };
  const handleDeleteRequest = async (id) => {
    if (isApi) { try { await apiDeleteRequest(id); toast.success("Request deleted from Supabase."); await fetchRequests(); fetchStats(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } return; }
    deleteRequest(id); toast.success("Request deleted.");
  };
  const handleAdjustInventory = async (id, units) => {
    if (isApi) { try { await apiAdjustInventory(id, units); toast.success("Inventory updated in Supabase."); await fetchInventory(); fetchStats(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); return; } }
    adjustInventory(id, units);
  };
  const handleUpdateHospital = async (id, patch) => {
    if (isApi) {
      try {
        const payload = {};
        if (patch.name !== undefined) payload.name = patch.name;
        if (patch.city !== undefined) payload.city = patch.city;
        if (patch.phone !== undefined) payload.phone = patch.phone;
        if (patch.emergency24x7 !== undefined) payload.emergency_24x7 = patch.emergency24x7;
        await apiUpdateHospital(id, payload); toast.success("Hospital updated in Supabase."); await fetchHospitals();
      } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); return; }
    }
    updateHospital(id, patch);
  };
  const handleDeleteHospital = async (id) => {
    if (isApi) { try { await apiDeleteHospital(id); toast.success("Hospital removed from Supabase."); await fetchHospitals(); fetchStats(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } return; }
    deleteHospital(id); toast.success("Hospital removed.");
  };
  const handleDeleteUser = async (id) => {
    if (id === user?.id) { toast.error("You can't delete your own account."); return; }
    if (isApi) { try { await apiDeleteUser(id); toast.success("User removed from Supabase."); await fetchUsers(); await fetchDonors(); fetchStats(); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } return; }
    deleteUser(id); toast.success("User removed.");
  };
  const handleToggleEmergency = async (h, v) => {
    if (isApi) { try { await apiUpdateHospital(h.id, { emergency_24x7: v }); setApiHospitals((prev) => prev ? prev.map((x) => x.id === h.id ? { ...x, emergency24x7: v } : x) : prev); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); return; } }
    updateHospital(h.id, { emergency24x7: v });
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "donor") handleDeleteDonor(confirm.id);
    else if (confirm.type === "request") handleDeleteRequest(confirm.id);
    else if (confirm.type === "hospital") handleDeleteHospital(confirm.id);
    else if (confirm.type === "user") handleDeleteUser(confirm.id);
    setConfirm(null);
  };

  return (
    <PageWrap>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage donors, inventory, requests, hospitals and users.{isApi ? " Live from Flask + Supabase." : " All changes are saved to your browser's localStorage (demo)."}
          </p>
        </div>
        <Button variant="secondary" className={btnSoft} onClick={() => setConfirm({ type: "reset", id: "", label: "Reset demo data" })}><RotateCcw className="size-4" /> Reset demo data</Button>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-5">
        <StatCard icon={<Users className="size-5" />} value={totalsDisplay.donors} label="Registered Donors" />
        <StatCard icon={<HeartPulse className="size-5" />} value={requestsLen} label="Blood Requests" sub={`${totalsDisplay.pendingRequests} pending`} />
        <StatCard icon={<Droplets className="size-5" />} value={totalsDisplay.units} label="Blood Units" sub="Across all banks" />
        <StatCard icon={<Building2 className="size-5" />} value={totalsDisplay.hospitals} label="Active Hospitals" />
        <StatCard icon={<Zap className="size-5" />} value={totalsDisplay.emergencyRequests} label="Emergency Requests" className="col-span-2 lg:col-span-1" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v)} className="mt-10">
        <div className="overflow-x-auto pb-1">
          <TabsList className="clay-inset h-auto w-max gap-1 rounded-2xl p-1.5">
            {[
              ["donors", `Donors (${donorsSource.length})`],
              ["inventory", `Inventory (${inventorySource.length})`],
              ["requests", `Requests (${requestsSource.length})`],
              ["hospitals", `Hospitals (${hospitalsSource.length})`],
              ["users", `Users (${usersSource.length})`],
            ].map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground sm:text-sm">{label}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="donors" className="mt-5">
          <Toolbar placeholder="Search donors by name, city, group…" value={q.donors} onChange={(v) => setQ({ ...q, donors: v })} filters={<>
            <select className={cn(selectCls, "h-10 w-36 rounded-xl")} value={donorGroup} onChange={(e) => setDonorGroup(e.target.value)}><option value="all">All groups</option>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
            <select className={cn(selectCls, "h-10 w-40 rounded-xl")} value={donorAvail} onChange={(e) => setDonorAvail(e.target.value)}><option value="all">All statuses</option><option value="true">Available</option><option value="false">Unavailable</option></select>
          </>} />
          <TableWrap count={donors.length}>
            <thead className="bg-muted/50"><tr><th className={th}>Donor</th><th className={th}>Group</th><th className={th}>City</th><th className={th}>Last Donation</th><th className={th}>Available</th><th className={cn(th, "text-right")}>Actions</th></tr></thead>
            <tbody>
              {donors.map((d) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={td}><p className="font-bold text-foreground">{d.name}</p><p className="text-xs text-muted-foreground">{d.age ? `${d.age} yrs · ` : ""}{d.gender} · {d.phone}</p></td>
                  <td className={td}><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{d.bloodGroup}</span></td>
                  <td className={cn(td, "text-muted-foreground")}>{d.city || "—"}</td>
                  <td className={cn(td, "text-muted-foreground")}>{fmtDate(d.lastDonation)}</td>
                  <td className={td}><Switch checked={d.available} onCheckedChange={(v) => handleToggleDonor(d.id, v)} aria-label={`Toggle availability for ${d.name}`} /></td>
                  <td className={cn(td, "text-right")}><RowActions onEdit={() => setEditDonor(d)} onDelete={() => setConfirm({ type: "donor", id: d.id, label: d.name })} editLabel={`Edit ${d.name}`} /></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        <TabsContent value="inventory" className="mt-5">
          <Toolbar placeholder="Search facilities, cities, groups…" value={q.inventory} onChange={(v) => setQ({ ...q, inventory: v })} filters={<select className={cn(selectCls, "h-10 w-40 rounded-xl")} value={invStatusF} onChange={(e) => setInvStatusF(e.target.value)}><option value="all">All statuses</option><option value="available">Available</option><option value="low">Low stock</option><option value="critical">Critical</option></select>} />
          <TableWrap count={inventory.length}>
            <thead className="bg-muted/50"><tr><th className={th}>Facility</th><th className={th}>City</th><th className={th}>Group</th><th className={th}>Units</th><th className={th}>Status</th><th className={th}>Updated</th><th className={cn(th, "text-right")}>Actions</th></tr></thead>
            <tbody>
              {inventory.map((i) => (
                <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>{i.facility}</td>
                  <td className={cn(td, "text-muted-foreground")}>{i.city}</td>
                  <td className={td}><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{i.bloodGroup}</span></td>
                  <td className={cn(td, "font-extrabold text-foreground")}>{i.units}</td>
                  <td className={td}><StatusPill status={inventoryStatus(i)} /></td>
                  <td className={cn(td, "text-xs text-muted-foreground")}>{fmtDate(i.updatedAt.slice(0, 10))}</td>
                  <td className={cn(td, "text-right")}><RowActions onEdit={() => setEditInv(i)} editLabel={`Edit stock for ${i.facility}`} /></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        <TabsContent value="requests" className="mt-5">
          <Toolbar placeholder="Search patients, hospitals…" value={q.requests} onChange={(v) => setQ({ ...q, requests: v })} filters={<select className={cn(selectCls, "h-10 w-40 rounded-xl")} value={reqStatusF} onChange={(e) => setReqStatusF(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="fulfilled">Fulfilled</option><option value="rejected">Rejected</option></select>} />
          <TableWrap count={requests.length}>
            <thead className="bg-muted/50"><tr><th className={th}>Patient</th><th className={th}>Group · Units</th><th className={th}>Hospital</th><th className={th}>Needed By</th><th className={th}>Urgency</th><th className={th}>Status</th><th className={cn(th, "text-right")}>Actions</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>{r.patientName}</td>
                  <td className={td}><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{r.bloodGroup}</span><span className="ml-1 text-xs font-bold text-muted-foreground">×{r.units}</span></td>
                  <td className={td}><p className="text-sm font-semibold text-foreground">{r.hospitalName}</p><p className="text-xs text-muted-foreground">{r.hospitalCity}</p></td>
                  <td className={cn(td, "text-muted-foreground")}>{fmtDate(r.neededBy)}</td>
                  <td className={td}><StatusPill status={r.urgency} /></td>
                  <td className={td}><StatusPill status={r.status} /></td>
                  <td className={cn(td, "text-right")}>
                    <div className="flex justify-end gap-1.5">
                      {r.status === "pending" && (<><Button size="sm" variant="secondary" className={cn(btnSoft, "h-8 px-2.5 text-xs")} onClick={() => handleRequestStatus(r.id, "approved")}>Approve</Button><Button size="sm" variant="secondary" className={cn(btnSoft, "h-8 px-2.5 text-xs")} onClick={() => handleRequestStatus(r.id, "rejected")}>Reject</Button></>)}
                      {r.status === "approved" && (<Button size="sm" className={cn(btnPrimary, "h-8 bg-emerald-600 px-2.5 text-xs hover:bg-emerald-600/90")} onClick={() => handleRequestStatus(r.id, "fulfilled")}>Fulfill</Button>)}
                      <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setConfirm({ type: "request", id: r.id, label: `${r.bloodGroup} request for ${r.patientName}` })} aria-label="Delete request"><Trash2 className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        <TabsContent value="hospitals" className="mt-5">
          <Toolbar placeholder="Search hospitals, cities…" value={q.hospitals} onChange={(v) => setQ({ ...q, hospitals: v })} />
          <TableWrap count={hospitals.length}>
            <thead className="bg-muted/50"><tr><th className={th}>Hospital</th><th className={th}>City</th><th className={th}>Phone</th><th className={th}>Groups</th><th className={th}>24×7 Emergency</th><th className={cn(th, "text-right")}>Actions</th></tr></thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>{h.name}</td>
                  <td className={cn(td, "text-muted-foreground")}>{h.city}</td>
                  <td className={cn(td, "text-muted-foreground")}>{h.phone}</td>
                  <td className={cn(td, "text-xs font-bold text-muted-foreground")}>{h.groups.length} groups</td>
                  <td className={td}><Switch checked={h.emergency24x7} onCheckedChange={(v) => handleToggleEmergency(h, v)} aria-label={`Toggle emergency for ${h.name}`} /></td>
                  <td className={cn(td, "text-right")}><RowActions onEdit={() => setEditHosp(h)} onDelete={() => setConfirm({ type: "hospital", id: h.id, label: h.name })} editLabel={`Edit ${h.name}`} /></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        <TabsContent value="users" className="mt-5">
          <Toolbar placeholder="Search users by name, email, role…" value={q.users} onChange={(v) => setQ({ ...q, users: v })} />
          <TableWrap count={users.length}>
            <thead className="bg-muted/50"><tr><th className={th}>User</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Joined</th><th className={cn(th, "text-right")}>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>{u.name} {u.id === user?.id && <span className="text-xs font-semibold text-primary">(you)</span>}</td>
                  <td className={cn(td, "text-muted-foreground")}>{u.email}</td>
                  <td className={td}>{u.role === "admin" && <Pill tone="redsolid">Admin</Pill>}{u.role === "hospital" && <Pill tone="orange">Hospital</Pill>}{u.role === "donor" && <Pill tone="green">Donor</Pill>}{u.role === "recipient" && <Pill tone="gray">Recipient</Pill>}</td>
                  <td className={cn(td, "text-muted-foreground")}>{fmtDate(u.createdAt)}</td>
                  <td className={cn(td, "text-right")}><Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setConfirm({ type: "user", id: u.id, label: u.name })} aria-label={`Delete ${u.name}`}><Trash2 className="size-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>
      </Tabs>

      <ConfirmDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)} title={confirm?.type === "reset" ? "Reset all demo data?" : `Delete ${confirm?.label ?? "this item"}?`} description={confirm?.type === "reset" ? "This restores the original sample donors, requests, inventory, hospitals and users. Your changes will be lost." : "This permanently removes the item from the database. This action cannot be undone."} confirmLabel={confirm?.type === "reset" ? "Reset" : "Delete"} onConfirm={() => { if (confirm?.type === "reset") { resetDemo(); toast.success("Demo data has been reset to the original sample."); } else { runConfirm(); } }} />

      <Dialog open={editDonor !== null} onOpenChange={(o) => !o && setEditDonor(null)}>
        <DialogContent className="clay-card max-w-md border-0 p-8">
          <DialogHeader><DialogTitle className="text-left">Edit donor</DialogTitle><DialogDescription className="text-left">Update donor details and availability.</DialogDescription></DialogHeader>
          {editDonor && (
            <div className="grid gap-4">
              <Field label="Full name"><input className={inputCls} value={editDonor.name} onChange={(e) => setEditDonor({ ...editDonor, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age"><input className={inputCls} type="number" min={18} max={65} value={editDonor.age || ""} onChange={(e) => setEditDonor({ ...editDonor, age: Number(e.target.value) })} /></Field>
                <Field label="Blood group"><select className={cn(selectCls, "h-11")} value={editDonor.bloodGroup} onChange={(e) => setEditDonor({ ...editDonor, bloodGroup: e.target.value })}>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select></Field>
              </div>
              <Field label="Phone"><input className={inputCls} value={editDonor.phone} onChange={(e) => setEditDonor({ ...editDonor, phone: e.target.value })} /></Field>
              <Field label="City"><input className={inputCls} value={editDonor.city} onChange={(e) => setEditDonor({ ...editDonor, city: e.target.value })} /></Field>
              <Button
                className={btnPrimary}
                onClick={async () => {
                  const patch = { name: editDonor.name.trim(), age: editDonor.age, blood_group: editDonor.bloodGroup, phone: editDonor.phone.trim(), city: editDonor.city.trim() };
                  if (isApi) { try { await apiUpdateDonor(editDonor.id, patch); setApiDonors((prev) => prev ? prev.map((d) => d.id === editDonor.id ? { ...d, ...{ name: patch.name, age: patch.age, bloodGroup: patch.blood_group, phone: patch.phone, city: patch.city } } : d) : prev); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); return; } }
                  updateDonor(editDonor.id, { name: patch.name, age: patch.age, bloodGroup: patch.blood_group, phone: patch.phone, city: patch.city });
                  setEditDonor(null); toast.success(isApi ? "Donor updated in Supabase." : "Donor updated.");
                }}
              >
                Save changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editInv !== null} onOpenChange={(o) => !o && setEditInv(null)}>
        <DialogContent className="clay-card max-w-sm border-0 p-8">
          <DialogHeader><DialogTitle className="text-left">Update stock</DialogTitle><DialogDescription className="text-left">{editInv?.facility} · {editInv?.bloodGroup} · {editInv?.city}</DialogDescription></DialogHeader>
          {editInv && (
            <div className="grid gap-4">
              <Field label="Available units" hint="Tip: values ≤ 3 show as Critical, ≤ threshold as Low Stock."><input className={inputCls} type="number" min={0} value={editInv.units} onChange={(e) => setEditInv({ ...editInv, units: Math.max(0, Number(e.target.value)) })} /></Field>
              <div className="flex gap-2"><Button className={cn(btnSoft, "flex-1")} variant="secondary" onClick={() => setEditInv({ ...editInv, units: editInv.units + 1 })}>+1 unit</Button><Button className={cn(btnSoft, "flex-1")} variant="secondary" onClick={() => setEditInv({ ...editInv, units: Math.max(0, editInv.units - 1) })}>−1 unit</Button></div>
              <Button className={btnPrimary} onClick={async () => { await handleAdjustInventory(editInv.id, editInv.units); setEditInv(null); }}><Droplet className="size-4" /> Save stock</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editHosp !== null} onOpenChange={(o) => !o && setEditHosp(null)}>
        <DialogContent className="clay-card max-w-md border-0 p-8">
          <DialogHeader><DialogTitle className="text-left">Edit hospital</DialogTitle><DialogDescription className="text-left">Update hospital contact details and emergency flag.</DialogDescription></DialogHeader>
          {editHosp && (
            <div className="grid gap-4">
              <Field label="Name"><input className={inputCls} value={editHosp.name} onChange={(e) => setEditHosp({ ...editHosp, name: e.target.value })} /></Field>
              <Field label="Phone"><input className={inputCls} value={editHosp.phone} onChange={(e) => setEditHosp({ ...editHosp, phone: e.target.value })} /></Field>
              <Field label="City"><input className={inputCls} value={editHosp.city} onChange={(e) => setEditHosp({ ...editHosp, city: e.target.value })} /></Field>
              <div className="clay-tile flex items-center justify-between p-4"><span className="flex items-center gap-2 text-sm font-bold text-foreground"><Siren className="size-4 text-primary" /> 24×7 emergency</span><Switch checked={editHosp.emergency24x7} onCheckedChange={(v) => setEditHosp({ ...editHosp, emergency24x7: v })} /></div>
              <Button className={btnPrimary} onClick={async () => { await handleUpdateHospital(editHosp.id, { name: editHosp.name.trim(), phone: editHosp.phone.trim(), city: editHosp.city.trim(), emergency24x7: editHosp.emergency24x7 }); setEditHosp(null); toast.success(isApi ? "Hospital updated in Supabase." : "Hospital updated."); }}><Building2 className="size-4" /> Save changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}

function Toolbar({ placeholder, value, onChange, filters }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className={cn(inputCls, "pl-10")} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div>
      {filters}
    </div>
  );
}
function TableWrap({ count, children }) {
  if (count === 0) return (<div className="clay-tile px-6 py-12 text-center"><Search className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="text-sm font-bold text-foreground">Nothing matches your search</p><p className="mt-1 text-xs text-muted-foreground">Try clearing the filters or using a different keyword.</p></div>);
  return (<div className="clay-card overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">{children}</table></div></div>);
}
function RowActions({ onEdit, onDelete, editLabel }) {
  return (
    <div className="flex justify-end gap-1.5">
      <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={editLabel}><Pencil className="size-4" /></Button>
      {onDelete && <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={onDelete} aria-label="Delete"><Trash2 className="size-4" /></Button>}
    </div>
  );
}
