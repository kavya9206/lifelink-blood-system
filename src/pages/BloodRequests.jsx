import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/store";
import { BLOOD_GROUPS } from "@/lib/types";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  PageWrap,
  Reveal,
  StatusPill,
  btnPrimary,
  btnSoft,
  inputCls,
  selectCls,
} from "@/components/clay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle2, Droplet, Filter, ListFilter, MapPin, Phone, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { isApiMode, apiListRequests, apiCreateRequest, apiSetRequestStatus, apiDeleteRequest } from "@/lib/api";
import { mapRequestRow, requestPayloadForApi } from "@/lib/mappers";

const statusFilters = ["all", "pending", "approved", "fulfilled", "rejected"];

export default function BloodRequests() {
  const { data, user, addRequest, setRequestStatus, deleteRequest } = useApp();
  const [params] = useSearchParams();

  const [form, setForm] = useState(() => ({
    patientName: "",
    bloodGroup: params.get("blood") || "",
    units: params.get("units") || "1",
    hospitalName: "",
    hospitalCity: params.get("city") || "",
    contact: user?.phone ?? "",
    neededBy: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    urgency: "urgent",
    notes: "",
  }));
  const [errors, setErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  // API-backed requests
  const [apiRequests, setApiRequests] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchRequests = async () => {
    if (!isApiMode) return;
    setApiLoading(true);
    try {
      const res = await apiListRequests();
      setApiRequests((res.requests ?? []).map(mapRequestRow));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setApiLoading(false);
    }
  };

  // Initial load — state updates live inside the .then() callback (never
  // synchronously in the effect body).
  useEffect(() => {
    if (!isApiMode) return;
    apiListRequests()
      .then((res) => setApiRequests((res.requests ?? []).map(mapRequestRow)))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
  }, []);

  const requests = isApiMode && apiRequests ? apiRequests : data.requests;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.patientName.trim().length < 3) errs.patientName = "Enter the patient's full name.";
    if (!form.bloodGroup) errs.bloodGroup = "Select a blood group.";
    const units = Number(form.units);
    if (!units || units < 1 || units > 10) errs.units = "Units must be between 1 and 10.";
    if (form.hospitalName.trim().length < 3) errs.hospitalName = "Enter the hospital name.";
    if (!form.hospitalCity) errs.hospitalCity = "Select the hospital's city.";
    if (!/^[+]?[\d\s-]{10,15}$/.test(form.contact.trim())) errs.contact = "Enter a valid contact number.";
    if (!form.neededBy) errs.neededBy = "Pick the required date.";
    else if (new Date(form.neededBy) < new Date(new Date().toDateString())) errs.neededBy = "Required date cannot be in the past.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const payload = {
      patientName: form.patientName.trim(),
      bloodGroup: form.bloodGroup,
      units,
      hospitalName: form.hospitalName.trim(),
      hospitalCity: form.hospitalCity,
      contact: form.contact.trim(),
      neededBy: form.neededBy,
      urgency: form.urgency,
      notes: form.notes.trim(),
    };

    if (isApiMode) {
      setBusy(true);
      try {
        await apiCreateRequest(requestPayloadForApi(payload));
        toast.success("Blood request submitted!", { description: "It now appears in Supabase for hospitals to fulfill." });
        setForm((f) => ({ ...f, patientName: "", notes: "", hospitalName: "" }));
        await fetchRequests();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    addRequest(payload, user?.id ?? null);
    toast.success("Blood request submitted!", { description: "Hospitals and donors near you can now see it on the board (demo)." });
    setForm((f) => ({ ...f, patientName: "", notes: "", hospitalName: "" }));
  };

  const visible = statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter);
  const canManage = user?.role === "admin" || user?.role === "hospital";

  const handleStatus = async (id, status) => {
    if (isApiMode) {
      try {
        await apiSetRequestStatus(id, status);
        toast.success(status === "fulfilled" ? "Request fulfilled — inventory updated in Supabase." : `Request ${status}.`);
        await fetchRequests();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
      return;
    }
    setRequestStatus(id, status);
    toast.success(status === "fulfilled" ? "Request fulfilled — inventory updated." : `Request ${status}.`);
  };

  const handleDelete = async (id) => {
    if (isApiMode) {
      try {
        await apiDeleteRequest(id);
        toast.success("Request deleted from Supabase.");
        await fetchRequests();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
      return;
    }
    deleteRequest(id);
    toast.success("Request deleted.");
  };

  return (
    <PageWrap>
      <Reveal>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Blood Requests</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Raise a request for a patient and track every request on the live board.</p>
        {isApiMode && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            Live from Flask + Supabase{apiLoading ? " · loading…" : ""}
          </p>
        )}
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <Reveal delay={0.05}>
          <form className="clay-card grid gap-4 p-6 sm:grid-cols-2 sm:p-8" onSubmit={submit} noValidate>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground sm:col-span-2">
              <Droplet className="size-5 text-primary" /> New Blood Request
            </h2>
            <Field label="Patient Name" error={errors.patientName}>
              <input className={inputCls} placeholder="e.g. Lakshmi Narayanan" value={form.patientName} onChange={(e) => set("patientName", e.target.value)} />
            </Field>
            <Field label="Blood Group" error={errors.bloodGroup}>
              <select className={selectCls} value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                <option value="">Select group</option>
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Required Units" error={errors.units}>
              <select className={selectCls} value={form.units} onChange={(e) => set("units", e.target.value)}>
                {Array.from({ length: 10 }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} unit{i > 0 ? "s" : ""}</option>)}
              </select>
            </Field>
            <Field label="Hospital Name" error={errors.hospitalName}>
              <input className={inputCls} placeholder="e.g. Apollo Hospitals" value={form.hospitalName} onChange={(e) => set("hospitalName", e.target.value)} />
            </Field>
            <Field label="Hospital Location (City)" error={errors.hospitalCity}>
              <select className={selectCls} value={form.hospitalCity} onChange={(e) => set("hospitalCity", e.target.value)}>
                <option value="">Select city</option>
                {["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Kochi"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Contact Number" error={errors.contact}>
              <input className={inputCls} inputMode="tel" placeholder="+91 98XXX XXXXX" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </Field>
            <Field label="Required Date" error={errors.neededBy}>
              <input className={inputCls} type="date" min={new Date().toISOString().slice(0, 10)} value={form.neededBy} onChange={(e) => set("neededBy", e.target.value)} />
            </Field>
            <Field label="Urgency" className="sm:col-span-2">
              <div className="grid grid-cols-3 gap-2">
                {["normal", "urgent", "critical"].map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => set("urgency", u)}
                    className={cn(
                      "rounded-2xl px-3 py-2.5 text-xs font-bold capitalize transition-all",
                      form.urgency === u
                        ? u === "critical"
                          ? "bg-destructive text-white shadow-[0_8px_16px_-6px_rgba(163,40,40,.55)]"
                          : u === "urgent"
                            ? "bg-orange-500 text-white shadow-[0_8px_16px_-6px_rgba(200,100,20,.45)]"
                            : "bg-emerald-600 text-white shadow-[0_8px_16px_-6px_rgba(20,120,80,.45)]"
                        : "clay-inset text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Additional Information" hint="Diagnosis, ward, attending doctor… (optional)" className="sm:col-span-2">
              <textarea className={cn(inputCls, "h-20 resize-none py-3")} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
            <Button size="lg" className={cn(btnPrimary, "sm:col-span-2")} disabled={busy}>
              <Droplet className="size-5" /> {busy ? "Submitting…" : "Submit Request"}
            </Button>
          </form>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
              <ListFilter className="size-5 text-primary" /> Request Board
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">{requests.length}</span>
            </h2>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-[0_6px_12px_-4px_rgba(163,40,40,.5)]"
                    : "clay-inset text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<Filter className="size-7" />}
              title="No requests here yet"
              message={statusFilter === "all" ? "Submit the form to raise the first blood request." : `No ${statusFilter} requests right now.`}
            />
          ) : (
            <ul className="grid gap-4">
              {visible.map((r) => (
                <li key={r.id} className="clay-tile p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">{r.bloodGroup}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-foreground">{r.patientName}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="size-3.5" /> {r.hospitalName}, {r.hospitalCity}
                      </p>
                    </div>
                    <StatusPill status={r.urgency} />
                    <StatusPill status={r.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
                    <span><b className="text-foreground">{r.units}</b> unit(s)</span>
                    <span className="flex items-center gap-1"><MapPin className="size-3.5" /> needed by {fmtDate(r.neededBy)}</span>
                    <span className="flex items-center gap-1"><Phone className="size-3.5" /> {r.contact}</span>
                    <span>raised {fmtDate(r.createdAt.slice(0, 10))}</span>
                  </div>
                  {r.notes && <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-xs italic text-muted-foreground">“{r.notes}”</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canManage && r.status === "pending" && (
                      <>
                        <Button size="sm" className={btnPrimary} onClick={() => handleStatus(r.id, "approved")}><CheckCircle2 className="size-4" /> Approve</Button>
                        <Button size="sm" variant="secondary" className={btnSoft} onClick={() => handleStatus(r.id, "rejected")}><XCircle className="size-4" /> Reject</Button>
                      </>
                    )}
                    {canManage && (r.status === "approved" || r.status === "pending") && (
                      <Button size="sm" className={cn(btnPrimary, "bg-emerald-600 hover:bg-emerald-600/90")} onClick={() => handleStatus(r.id, "fulfilled")}><Droplet className="size-4" /> Mark fulfilled</Button>
                    )}
                    {(canManage || r.requestedBy === user?.id) && (
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setConfirmDelete(r.id)}><Trash2 className="size-4" /> Delete</Button>
                    )}
                    <Button asChild size="sm" variant="ghost" className="ml-auto text-primary hover:bg-secondary">
                      <Link to={`/find-blood?blood=${r.bloodGroup}&city=${r.hospitalCity}`}>Find stock</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this blood request?"
        description="This removes the request from the board permanently. This action cannot be undone."
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </PageWrap>
  );
}
