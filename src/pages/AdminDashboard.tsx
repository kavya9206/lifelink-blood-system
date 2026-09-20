import { useMemo, useState, type ReactNode } from "react";
import { useApp, fmtDate } from "@/lib/store";
import { inventoryStatus, BLOOD_GROUPS, type BloodGroup, type Donor, type Hospital, type InventoryItem } from "@/lib/types";
import {
  ConfirmDialog,
  Field,
  PageWrap,
  Pill,
  Reveal,
  StatCard,
  StatusPill,
  btnPrimary,
  btnSoft,
  inputCls,
  selectCls,
} from "@/components/clay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Building2,
  Droplet,
  Droplets,
  HeartPulse,
  Pencil,
  RotateCcw,
  Search,
  Siren,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type TableKey = "donors" | "inventory" | "requests" | "hospitals" | "users";

const th = "px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-muted-foreground";
const td = "px-5 py-3.5";

export default function AdminDashboard() {
  const {
    data,
    totals,
    user,
    updateDonor,
    deleteDonor,
    setRequestStatus,
    deleteRequest,
    adjustInventory,
    updateHospital,
    deleteHospital,
    deleteUser,
    resetDemo,
  } = useApp();

  const [tab, setTab] = useState<TableKey>("donors");
  const [q, setQ] = useState<Record<TableKey, string>>({ donors: "", inventory: "", requests: "", hospitals: "", users: "" });
  const [donorGroup, setDonorGroup] = useState<string>("all");
  const [donorAvail, setDonorAvail] = useState<string>("all");
  const [invStatusF, setInvStatusF] = useState<string>("all");
  const [reqStatusF, setReqStatusF] = useState<string>("all");

  const [confirm, setConfirm] = useState<{ type: string; id: string; label: string } | null>(null);

  // Edit dialogs
  const [editDonor, setEditDonor] = useState<Donor | null>(null);
  const [editInv, setEditInv] = useState<InventoryItem | null>(null);
  const [editHosp, setEditHosp] = useState<Hospital | null>(null);

  /* ---------------- Derived lists ---------------- */

  const donors = useMemo(() => {
    const s = q.donors.toLowerCase();
    return data.donors.filter(
      (d) =>
        (!s || `${d.name} ${d.city} ${d.bloodGroup} ${d.phone}`.toLowerCase().includes(s)) &&
        (donorGroup === "all" || d.bloodGroup === donorGroup) &&
        (donorAvail === "all" || String(d.available) === donorAvail),
    );
  }, [data.donors, q.donors, donorGroup, donorAvail]);

  const inventory = useMemo(() => {
    const s = q.inventory.toLowerCase();
    return data.inventory.filter(
      (i) => (!s || `${i.facility} ${i.city} ${i.bloodGroup}`.toLowerCase().includes(s)) && (invStatusF === "all" || inventoryStatus(i) === invStatusF),
    );
  }, [data.inventory, q.inventory, invStatusF]);

  const requests = useMemo(() => {
    const s = q.requests.toLowerCase();
    return data.requests.filter(
      (r) => (!s || `${r.patientName} ${r.hospitalName} ${r.hospitalCity} ${r.bloodGroup}`.toLowerCase().includes(s)) && (reqStatusF === "all" || r.status === reqStatusF),
    );
  }, [data.requests, q.requests, reqStatusF]);

  const hospitals = useMemo(() => {
    const s = q.hospitals.toLowerCase();
    return data.hospitals.filter((h) => !s || `${h.name} ${h.city} ${h.phone}`.toLowerCase().includes(s));
  }, [data.hospitals, q.hospitals]);

  const users = useMemo(() => {
    const s = q.users.toLowerCase();
    return data.users.filter((u) => !s || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(s));
  }, [data.users, q.users]);

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "donor") {
      deleteDonor(confirm.id);
      toast.success("Donor removed.");
    } else if (confirm.type === "request") {
      deleteRequest(confirm.id);
      toast.success("Request deleted.");
    } else if (confirm.type === "hospital") {
      deleteHospital(confirm.id);
      toast.success("Hospital removed.");
    } else if (confirm.type === "user") {
      if (confirm.id === user?.id) {
        toast.error("You can't delete your own account.");
      } else {
        deleteUser(confirm.id);
        toast.success("User removed.");
      }
    }
    setConfirm(null);
  };

  /* ---------------- Render ---------------- */

  return (
    <PageWrap>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage donors, inventory, requests, hospitals and users. All changes are saved to your
            browser's localStorage (demo).
          </p>
        </div>
        <Button
          variant="secondary"
          className={btnSoft}
          onClick={() =>
            setConfirm({ type: "reset", id: "", label: "Reset demo data" })
          }
        >
          <RotateCcw className="size-4" /> Reset demo data
        </Button>
      </Reveal>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-5">
        <StatCard icon={<Users className="size-5" />} value={totals.donors} label="Registered Donors" />
        <StatCard icon={<HeartPulse className="size-5" />} value={data.requests.length} label="Blood Requests" sub={`${totals.pendingRequests} pending`} />
        <StatCard icon={<Droplets className="size-5" />} value={totals.units} label="Blood Units" sub="Across all banks" />
        <StatCard icon={<Building2 className="size-5" />} value={totals.hospitals} label="Active Hospitals" />
        <StatCard icon={<Zap className="size-5" />} value={totals.emergencyRequests} label="Emergency Requests" className="col-span-2 lg:col-span-1" />
      </div>

      {/* Management tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TableKey)} className="mt-10">
        <div className="overflow-x-auto pb-1">
          <TabsList className="clay-inset h-auto w-max gap-1 rounded-2xl p-1.5">
            {(
              [
                ["donors", `Donors (${data.donors.length})`],
                ["inventory", `Inventory (${data.inventory.length})`],
                ["requests", `Requests (${data.requests.length})`],
                ["hospitals", `Hospitals (${data.hospitals.length})`],
                ["users", `Users (${data.users.length})`],
              ] as [TableKey, string][]
            ).map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground sm:text-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ---------- DONORS ---------- */}
        <TabsContent value="donors" className="mt-5">
          <Toolbar
            placeholder="Search donors by name, city, group…"
            value={q.donors}
            onChange={(v) => setQ({ ...q, donors: v })}
            filters={
              <>
                <select className={cn(selectCls, "h-10 w-36 rounded-xl")} value={donorGroup} onChange={(e) => setDonorGroup(e.target.value)}>
                  <option value="all">All groups</option>
                  {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>
                <select className={cn(selectCls, "h-10 w-40 rounded-xl")} value={donorAvail} onChange={(e) => setDonorAvail(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </>
            }
          />
          <TableWrap count={donors.length}>
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>Donor</th>
                <th className={th}>Group</th>
                <th className={th}>City</th>
                <th className={th}>Last Donation</th>
                <th className={th}>Available</th>
                <th className={cn(th, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={td}>
                    <p className="font-bold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.age ? `${d.age} yrs · ` : ""}{d.gender} · {d.phone}</p>
                  </td>
                  <td className={td}>
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{d.bloodGroup}</span>
                  </td>
                  <td className={cn(td, "text-muted-foreground")}>{d.city || "—"}</td>
                  <td className={cn(td, "text-muted-foreground")}>{fmtDate(d.lastDonation)}</td>
                  <td className={td}>
                    <Switch
                      checked={d.available}
                      onCheckedChange={(v) => updateDonor(d.id, { available: v })}
                      aria-label={`Toggle availability for ${d.name}`}
                    />
                  </td>
                  <td className={cn(td, "text-right")}>
                    <RowActions
                      onEdit={() => setEditDonor(d)}
                      onDelete={() => setConfirm({ type: "donor", id: d.id, label: d.name })}
                      editLabel={`Edit ${d.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        {/* ---------- INVENTORY ---------- */}
        <TabsContent value="inventory" className="mt-5">
          <Toolbar
            placeholder="Search facilities, cities, groups…"
            value={q.inventory}
            onChange={(v) => setQ({ ...q, inventory: v })}
            filters={
              <select className={cn(selectCls, "h-10 w-40 rounded-xl")} value={invStatusF} onChange={(e) => setInvStatusF(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="low">Low stock</option>
                <option value="critical">Critical</option>
              </select>
            }
          />
          <TableWrap count={inventory.length}>
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>Facility</th>
                <th className={th}>City</th>
                <th className={th}>Group</th>
                <th className={th}>Units</th>
                <th className={th}>Status</th>
                <th className={th}>Updated</th>
                <th className={cn(th, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((i) => (
                <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>{i.facility}</td>
                  <td className={cn(td, "text-muted-foreground")}>{i.city}</td>
                  <td className={td}>
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{i.bloodGroup}</span>
                  </td>
                  <td className={cn(td, "font-extrabold text-foreground")}>{i.units}</td>
                  <td className={td}><StatusPill status={inventoryStatus(i)} /></td>
                  <td className={cn(td, "text-xs text-muted-foreground")}>{fmtDate(i.updatedAt.slice(0, 10))}</td>
                  <td className={cn(td, "text-right")}>
                    <RowActions onEdit={() => setEditInv(i)} editLabel={`Edit stock for ${i.facility}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        {/* ---------- REQUESTS ---------- */}
        <TabsContent value="requests" className="mt-5">
          <Toolbar
            placeholder="Search patients, hospitals…"
            value={q.requests}
            onChange={(v) => setQ({ ...q, requests: v })}
            filters={
              <select className={cn(selectCls, "h-10 w-40 rounded-xl")} value={reqStatusF} onChange={(e) => setReqStatusF(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="rejected">Rejected</option>
              </select>
            }
          />
          <TableWrap count={requests.length}>
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>Patient</th>
                <th className={th}>Group · Units</th>
                <th className={th}>Hospital</th>
                <th className={th}>Needed By</th>
                <th className={th}>Urgency</th>
                <th className={th}>Status</th>
                <th className={cn(th, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>{r.patientName}</td>
                  <td className={td}>
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{r.bloodGroup}</span>
                    <span className="ml-1 text-xs font-bold text-muted-foreground">×{r.units}</span>
                  </td>
                  <td className={td}>
                    <p className="text-sm font-semibold text-foreground">{r.hospitalName}</p>
                    <p className="text-xs text-muted-foreground">{r.hospitalCity}</p>
                  </td>
                  <td className={cn(td, "text-muted-foreground")}>{fmtDate(r.neededBy)}</td>
                  <td className={td}><StatusPill status={r.urgency} /></td>
                  <td className={td}><StatusPill status={r.status} /></td>
                  <td className={cn(td, "text-right")}>
                    <div className="flex justify-end gap-1.5">
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" variant="secondary" className={cn(btnSoft, "h-8 px-2.5 text-xs")} onClick={() => { setRequestStatus(r.id, "approved"); toast.success("Request approved."); }}>
                            Approve
                          </Button>
                          <Button size="sm" variant="secondary" className={cn(btnSoft, "h-8 px-2.5 text-xs")} onClick={() => { setRequestStatus(r.id, "rejected"); toast.info("Request rejected."); }}>
                            Reject
                          </Button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <Button size="sm" className={cn(btnPrimary, "h-8 bg-emerald-600 px-2.5 text-xs hover:bg-emerald-600/90")} onClick={() => { setRequestStatus(r.id, "fulfilled"); toast.success("Fulfilled — inventory updated."); }}>
                          Fulfill
                        </Button>
                      )}
                      <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setConfirm({ type: "request", id: r.id, label: `${r.bloodGroup} request for ${r.patientName}` })} aria-label="Delete request">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        {/* ---------- HOSPITALS ---------- */}
        <TabsContent value="hospitals" className="mt-5">
          <Toolbar
            placeholder="Search hospitals, cities…"
            value={q.hospitals}
            onChange={(v) => setQ({ ...q, hospitals: v })}
          />
          <TableWrap count={hospitals.length}>
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>Hospital</th>
                <th className={th}>City</th>
                <th className={th}>Phone</th>
                <th className={th}>Groups</th>
                <th className={th}>24×7 Emergency</th>
                <th className={cn(th, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>{h.name}</td>
                  <td className={cn(td, "text-muted-foreground")}>{h.city}</td>
                  <td className={cn(td, "text-muted-foreground")}>{h.phone}</td>
                  <td className={cn(td, "text-xs font-bold text-muted-foreground")}>{h.groups.length} groups</td>
                  <td className={td}>
                    <Switch checked={h.emergency24x7} onCheckedChange={(v) => updateHospital(h.id, { emergency24x7: v })} aria-label={`Toggle emergency for ${h.name}`} />
                  </td>
                  <td className={cn(td, "text-right")}>
                    <RowActions
                      onEdit={() => setEditHosp(h)}
                      onDelete={() => setConfirm({ type: "hospital", id: h.id, label: h.name })}
                      editLabel={`Edit ${h.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>

        {/* ---------- USERS ---------- */}
        <TabsContent value="users" className="mt-5">
          <Toolbar
            placeholder="Search users by name, email, role…"
            value={q.users}
            onChange={(v) => setQ({ ...q, users: v })}
          />
          <TableWrap count={users.length}>
            <thead className="bg-muted/50">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Email</th>
                <th className={th}>Role</th>
                <th className={th}>Joined</th>
                <th className={cn(th, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className={cn(td, "font-bold text-foreground")}>
                    {u.name} {u.id === user?.id && <span className="text-xs font-semibold text-primary">(you)</span>}
                  </td>
                  <td className={cn(td, "text-muted-foreground")}>{u.email}</td>
                  <td className={td}>
                    {u.role === "admin" && <Pill tone="redsolid">Admin</Pill>}
                    {u.role === "hospital" && <Pill tone="orange">Hospital</Pill>}
                    {u.role === "donor" && <Pill tone="green">Donor</Pill>}
                    {u.role === "recipient" && <Pill tone="gray">Recipient</Pill>}
                  </td>
                  <td className={cn(td, "text-muted-foreground")}>{fmtDate(u.createdAt)}</td>
                  <td className={cn(td, "text-right")}>
                    <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setConfirm({ type: "user", id: u.id, label: u.name })} aria-label={`Delete ${u.name}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </TabsContent>
      </Tabs>

      {/* ---------- Confirm dialog (delete / reset) ---------- */}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={
          confirm?.type === "reset"
            ? "Reset all demo data?"
            : `Delete ${confirm?.label ?? "this item"}?`
        }
        description={
          confirm?.type === "reset"
            ? "This restores the original sample donors, requests, inventory, hospitals and users. Your changes will be lost."
            : "This permanently removes the item from the demo database. This action cannot be undone."
        }
        confirmLabel={confirm?.type === "reset" ? "Reset" : "Delete"}
        onConfirm={() => {
          if (confirm?.type === "reset") {
            resetDemo();
            toast.success("Demo data has been reset to the original sample.");
          } else {
            runConfirm();
          }
        }}
      />

      {/* ---------- Edit donor dialog ---------- */}
      <Dialog open={editDonor !== null} onOpenChange={(o) => !o && setEditDonor(null)}>
        <DialogContent className="clay-card max-w-md border-0 p-8">
          <DialogHeader>
            <DialogTitle className="text-left">Edit donor</DialogTitle>
            <DialogDescription className="text-left">Update donor details and availability.</DialogDescription>
          </DialogHeader>
          {editDonor && (
            <div className="grid gap-4">
              <Field label="Full name">
                <input className={inputCls} value={editDonor.name} onChange={(e) => setEditDonor({ ...editDonor, name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age">
                  <input className={inputCls} type="number" min={18} max={65} value={editDonor.age || ""} onChange={(e) => setEditDonor({ ...editDonor, age: Number(e.target.value) })} />
                </Field>
                <Field label="Blood group">
                  <select className={cn(selectCls, "h-11")} value={editDonor.bloodGroup} onChange={(e) => setEditDonor({ ...editDonor, bloodGroup: e.target.value as BloodGroup })}>
                    {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Phone">
                <input className={inputCls} value={editDonor.phone} onChange={(e) => setEditDonor({ ...editDonor, phone: e.target.value })} />
              </Field>
              <Field label="City">
                <input className={inputCls} value={editDonor.city} onChange={(e) => setEditDonor({ ...editDonor, city: e.target.value })} />
              </Field>
              <Button className={btnPrimary} onClick={() => {
                updateDonor(editDonor.id, {
                  name: editDonor.name.trim(),
                  age: editDonor.age,
                  bloodGroup: editDonor.bloodGroup,
                  phone: editDonor.phone.trim(),
                  city: editDonor.city.trim(),
                });
                setEditDonor(null);
                toast.success("Donor updated.");
              }}>
                Save changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Edit inventory dialog ---------- */}
      <Dialog open={editInv !== null} onOpenChange={(o) => !o && setEditInv(null)}>
        <DialogContent className="clay-card max-w-sm border-0 p-8">
          <DialogHeader>
            <DialogTitle className="text-left">Update stock</DialogTitle>
            <DialogDescription className="text-left">
              {editInv?.facility} · {editInv?.bloodGroup} · {editInv?.city}
            </DialogDescription>
          </DialogHeader>
          {editInv && (
            <div className="grid gap-4">
              <Field label="Available units" hint="Tip: values ≤ 3 show as Critical, ≤ threshold as Low Stock.">
                <input className={inputCls} type="number" min={0} value={editInv.units} onChange={(e) => setEditInv({ ...editInv, units: Math.max(0, Number(e.target.value)) })} />
              </Field>
              <div className="flex gap-2">
                <Button className={cn(btnSoft, "flex-1")} variant="secondary" onClick={() => setEditInv({ ...editInv, units: editInv.units + 1 })}>+1 unit</Button>
                <Button className={cn(btnSoft, "flex-1")} variant="secondary" onClick={() => setEditInv({ ...editInv, units: Math.max(0, editInv.units - 1) })}>−1 unit</Button>
              </div>
              <Button className={btnPrimary} onClick={() => {
                adjustInventory(editInv.id, editInv.units);
                setEditInv(null);
                toast.success("Inventory updated.");
              }}>
                <Droplet className="size-4" /> Save stock
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Edit hospital dialog ---------- */}
      <Dialog open={editHosp !== null} onOpenChange={(o) => !o && setEditHosp(null)}>
        <DialogContent className="clay-card max-w-md border-0 p-8">
          <DialogHeader>
            <DialogTitle className="text-left">Edit hospital</DialogTitle>
            <DialogDescription className="text-left">Update hospital contact details and emergency flag.</DialogDescription>
          </DialogHeader>
          {editHosp && (
            <div className="grid gap-4">
              <Field label="Name">
                <input className={inputCls} value={editHosp.name} onChange={(e) => setEditHosp({ ...editHosp, name: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={editHosp.phone} onChange={(e) => setEditHosp({ ...editHosp, phone: e.target.value })} />
              </Field>
              <Field label="City">
                <input className={inputCls} value={editHosp.city} onChange={(e) => setEditHosp({ ...editHosp, city: e.target.value })} />
              </Field>
              <div className="clay-tile flex items-center justify-between p-4">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground"><Siren className="size-4 text-primary" /> 24×7 emergency</span>
                <Switch checked={editHosp.emergency24x7} onCheckedChange={(v) => setEditHosp({ ...editHosp, emergency24x7: v })} />
              </div>
              <Button className={btnPrimary} onClick={() => {
                updateHospital(editHosp.id, {
                  name: editHosp.name.trim(),
                  phone: editHosp.phone.trim(),
                  city: editHosp.city.trim(),
                  emergency24x7: editHosp.emergency24x7,
                });
                setEditHosp(null);
                toast.success("Hospital updated.");
              }}>
                <Building2 className="size-4" /> Save changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}

/* ---------------- Small local components ---------------- */

function Toolbar({
  placeholder,
  value,
  onChange,
  filters,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  filters?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input className={cn(inputCls, "pl-10")} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      {filters}
    </div>
  );
}

function TableWrap({ count, children }: { count: number; children: ReactNode }) {
  if (count === 0) {
    return (
      <div className="clay-tile px-6 py-12 text-center">
        <Search className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Nothing matches your search</p>
        <p className="mt-1 text-xs text-muted-foreground">Try clearing the filters or using a different keyword.</p>
      </div>
    );
  }
  return (
    <div className="clay-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">{children}</table>
      </div>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  editLabel,
}: {
  onEdit: () => void;
  onDelete?: () => void;
  editLabel: string;
}) {
  return (
    <div className="flex justify-end gap-1.5">
      <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={editLabel}>
        <Pencil className="size-4" />
      </Button>
      {onDelete && (
        <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={onDelete} aria-label="Delete">
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
