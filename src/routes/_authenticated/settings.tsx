import { AlertDialog } from "@base-ui/react/alert-dialog";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Mail,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";

import { AppControls } from "#/components/app-controls";
import { Brand } from "#/components/brand";
import { Button } from "#/components/ui/button";
import { organizationCopy } from "#/content/organization";
import {
  deleteOrganizationFn,
  updateOrganizationFn,
} from "#/contexts/organizations/slices/manage-organization/functions";
import { resolveUiLocale } from "#/shared/i18n";

const fallbackTimeZones = ["Europe/Amsterdam", "Europe/London", "UTC"];
const timeZones =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : fallbackTimeZones;

export const Route = createFileRoute("/_authenticated/settings")({
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => {
    const state = context.organizationContext;

    if (state.status === "setup-required") {
      throw redirect({ to: "/setup", search: { lang: deps.lang } });
    }

    return {
      organization: state.status === "ready" ? state.organization : undefined,
      unavailable: state.status !== "ready",
    };
  },
  head: ({ match }) => {
    const copy = organizationCopy[resolveUiLocale(match.search.lang)].settings;

    return {
      meta: [
        { title: copy.meta.title },
        { name: "description", content: copy.meta.description },
      ],
    };
  },
  component: SettingsPage,
});

type SettingsError = "INVALID_INPUT" | "UNAVAILABLE";

const dialogBackdropClass =
  "fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0";
const dialogViewportClass =
  "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6";
const dialogPopupClass =
  "w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-[0_30px_90px_-35px_oklch(0.18_0.03_150/0.65)] outline-none transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-8";

function SettingsPage() {
  const lang = resolveUiLocale(Route.useSearch().lang);
  const { organization, unavailable } = Route.useLoaderData();
  const allCopy = organizationCopy[lang];
  const copy = allCopy.settings;
  const navigate = useNavigate();
  const router = useRouter();

  if (unavailable || !organization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <p role="alert" className="text-muted-foreground">
          {allCopy.unavailable}
        </p>
      </main>
    );
  }

  return (
    <SettingsContent
      key={`${organization.id}:${organization.name}:${organization.timeZone}`}
      organization={organization}
      lang={lang}
      copy={copy}
      navigate={navigate}
      invalidate={() => router.invalidate()}
    />
  );
}

function SettingsContent({
  organization,
  lang,
  copy,
  navigate,
  invalidate,
}: {
  organization: NonNullable<
    ReturnType<typeof Route.useLoaderData>["organization"]
  >;
  lang: ReturnType<typeof resolveUiLocale>;
  copy: (typeof organizationCopy)[ReturnType<
    typeof resolveUiLocale
  >]["settings"];
  navigate: ReturnType<typeof useNavigate>;
  invalidate: () => Promise<void>;
}) {
  const [name, setName] = useState(organization.name);
  const [timeZone, setTimeZone] = useState(organization.timeZone);
  const [savedName, setSavedName] = useState(organization.name);
  const [savedTimeZone, setSavedTimeZone] = useState(organization.timeZone);
  const [settingsError, setSettingsError] = useState<
    SettingsError | undefined
  >();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeZoneDialogOpen, setTimeZoneDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationPreview, setCancellationPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasChanges = name.trim() !== savedName || timeZone !== savedTimeZone;

  async function saveOrganization(): Promise<boolean> {
    setSettingsError(undefined);
    setSaved(false);
    setIsSaving(true);

    try {
      const result = await updateOrganizationFn({ data: { name, timeZone } });

      if (!result.ok) {
        if (result.error === "UNAUTHENTICATED") {
          await navigate({ to: "/login", search: { lang } });
          return false;
        }

        setSettingsError(result.error);
        return false;
      }

      setName(result.organization.name);
      setTimeZone(result.organization.timeZone);
      setSavedName(result.organization.name);
      setSavedTimeZone(result.organization.timeZone);
      setSaved(true);
      await invalidate();
      return true;
    } catch {
      setSettingsError("UNAVAILABLE");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function submitDetails(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (timeZone !== savedTimeZone) {
      setTimeZoneDialogOpen(true);
      return;
    }

    await saveOrganization();
  }

  async function confirmTimeZoneChange() {
    const didSave = await saveOrganization();
    if (didSave) {
      setTimeZoneDialogOpen(false);
    }
  }

  async function deleteEverything() {
    setDeleteError(false);
    setIsDeleting(true);

    try {
      const result = await deleteOrganizationFn();

      if (!result.ok) {
        if (result.error === "UNAUTHENTICATED") {
          window.location.assign(`/login?lang=${lang}`);
          return;
        }

        setDeleteError(true);
        return;
      }

      window.location.assign(`/?lang=${lang}&deleted=1`);
    } catch {
      setDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-border border-b bg-card/80 backdrop-blur">
        <div className="mx-auto grid h-18 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8">
          <a href={`/dashboard?lang=${lang}`} className="w-fit">
            <Brand />
          </a>
          <AppControls
            authenticated
            locale={lang}
            className="justify-self-end"
          />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          to="/dashboard"
          search={{ lang }}
          className="inline-flex items-center gap-2 font-semibold text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {copy.back}
        </Link>
        <h1 className="mt-4 text-balance font-heading font-semibold text-4xl tracking-[-0.055em] sm:text-6xl">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {copy.description}
        </p>

        <div className="mt-10 space-y-5">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-46px_oklch(0.23_0.035_151/0.4)] sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <Building2 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
                  {copy.details.title}
                </h2>
                <p className="mt-1 max-w-2xl text-muted-foreground text-sm leading-relaxed">
                  {copy.details.description}
                </p>
              </div>
            </div>

            <form onSubmit={submitDetails} noValidate className="mt-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="settings-organization-name"
                    className="font-semibold text-sm"
                  >
                    {copy.details.nameLabel}
                  </label>
                  <div className="relative mt-2">
                    <Building2
                      aria-hidden="true"
                      className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="settings-organization-name"
                      type="text"
                      autoComplete="organization"
                      required
                      maxLength={100}
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setSaved(false);
                      }}
                      placeholder={copy.details.namePlaceholder}
                      aria-invalid={
                        settingsError === "INVALID_INPUT" || undefined
                      }
                      aria-describedby={
                        settingsError
                          ? "organization-settings-status"
                          : undefined
                      }
                      className="h-13 w-full rounded-2xl border border-input bg-background pr-4 pl-12 outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="settings-time-zone"
                    className="font-semibold text-sm"
                  >
                    {copy.details.timeZoneLabel}
                  </label>
                  <div className="relative mt-2">
                    <Clock3
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                    />
                    <select
                      id="settings-time-zone"
                      required
                      value={timeZone}
                      onChange={(event) => {
                        setTimeZone(event.target.value);
                        setSaved(false);
                      }}
                      aria-invalid={
                        settingsError === "INVALID_INPUT" || undefined
                      }
                      aria-describedby="settings-time-zone-hint"
                      className="h-13 w-full appearance-none rounded-2xl border border-input bg-background pr-10 pl-12 outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15"
                    >
                      {timeZones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <p
                id="settings-time-zone-hint"
                className="mt-3 text-muted-foreground text-xs leading-relaxed"
              >
                {copy.details.timeZoneHint}
              </p>

              <Button
                type="submit"
                size="lg"
                disabled={isSaving || name.trim().length === 0 || !hasChanges}
                className="mt-6 h-12 w-full font-semibold"
              >
                <Check aria-hidden="true" />
                {isSaving ? copy.details.saving : copy.details.save}
              </Button>

              <div className="min-h-12 pt-3">
                {settingsError ? (
                  <p
                    id="organization-settings-status"
                    role="alert"
                    className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
                  >
                    {settingsError === "INVALID_INPUT"
                      ? copy.details.errors.invalid
                      : copy.details.errors.unavailable}
                  </p>
                ) : saved ? (
                  <output
                    id="organization-settings-status"
                    className="rounded-xl bg-primary/10 px-3 py-2 text-primary text-sm"
                  >
                    {copy.details.saved}
                  </output>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <Users aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
                    {copy.team.title}
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground text-xs">
                    {copy.team.badge}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                  {copy.team.description}
                </p>
              </div>
            </div>

            <fieldset disabled className="mt-7 opacity-60">
              <label htmlFor="invite-email" className="font-semibold text-sm">
                {copy.team.emailLabel}
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail
                    aria-hidden="true"
                    className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="invite-email"
                    type="email"
                    placeholder={copy.team.emailPlaceholder}
                    className="h-12 w-full rounded-2xl border border-input bg-muted/40 pr-4 pl-12 outline-none"
                  />
                </div>
                <Button type="button" size="lg" className="h-12 sm:px-6">
                  <UserPlus aria-hidden="true" />
                  {copy.team.invite}
                </Button>
              </div>
            </fieldset>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                  <CreditCard aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h2 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
                    {copy.subscription.title}
                  </h2>
                  <p className="mt-1 max-w-xl text-muted-foreground text-sm leading-relaxed">
                    {copy.subscription.description}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setCancellationPreview(false);
                  setCancelDialogOpen(true);
                }}
                className="sm:self-center"
              >
                {copy.subscription.cancel}
              </Button>
            </div>
            {cancellationPreview ? (
              <output className="mt-5 block rounded-xl bg-muted px-3 py-2 text-muted-foreground text-sm">
                {copy.subscription.preview}
              </output>
            ) : null}
          </section>

          <section className="rounded-3xl border border-destructive/25 bg-destructive/3 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                  <Trash2 aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h2 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
                    {copy.danger.title}
                  </h2>
                  <p className="mt-1 max-w-xl text-muted-foreground text-sm leading-relaxed">
                    {copy.danger.description}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={() => {
                  setDeleteAcknowledged(false);
                  setDeleteError(false);
                  setDeleteDialogOpen(true);
                }}
                className="border-destructive/20 sm:self-center"
              >
                <Trash2 aria-hidden="true" />
                {copy.danger.delete}
              </Button>
            </div>
          </section>
        </div>
      </div>

      <AlertDialog.Root
        open={timeZoneDialogOpen}
        onOpenChange={setTimeZoneDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={dialogBackdropClass} />
          <AlertDialog.Viewport className={dialogViewportClass}>
            <AlertDialog.Popup className={dialogPopupClass}>
              <AlertDialog.Title className="font-heading font-semibold text-2xl tracking-[-0.04em]">
                {copy.timeZoneDialog.title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-3 text-muted-foreground leading-relaxed">
                {copy.timeZoneDialog.description}
              </AlertDialog.Description>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <AlertDialog.Close
                  render={<Button type="button" variant="outline" size="lg" />}
                >
                  {copy.timeZoneDialog.cancel}
                </AlertDialog.Close>
                <Button
                  type="button"
                  size="lg"
                  disabled={isSaving}
                  onClick={confirmTimeZoneChange}
                >
                  {isSaving ? copy.details.saving : copy.timeZoneDialog.confirm}
                </Button>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={dialogBackdropClass} />
          <AlertDialog.Viewport className={dialogViewportClass}>
            <AlertDialog.Popup className={dialogPopupClass}>
              <AlertDialog.Title className="font-heading font-semibold text-2xl tracking-[-0.04em]">
                {copy.subscription.dialog.title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-3 text-muted-foreground leading-relaxed">
                {copy.subscription.dialog.description}
              </AlertDialog.Description>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <AlertDialog.Close
                  render={<Button type="button" variant="outline" size="lg" />}
                >
                  {copy.subscription.dialog.back}
                </AlertDialog.Close>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => {
                    setCancelDialogOpen(false);
                    setCancellationPreview(true);
                  }}
                >
                  {copy.subscription.dialog.confirm}
                </Button>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={dialogBackdropClass} />
          <AlertDialog.Viewport className={dialogViewportClass}>
            <AlertDialog.Popup className={dialogPopupClass}>
              <AlertDialog.Title className="font-heading font-semibold text-2xl tracking-[-0.04em]">
                {copy.danger.dialog.title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-3 text-muted-foreground leading-relaxed">
                {copy.danger.dialog.description}
              </AlertDialog.Description>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={deleteAcknowledged}
                  onChange={(event) =>
                    setDeleteAcknowledged(event.target.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 accent-destructive"
                />
                <span>{copy.danger.dialog.acknowledge}</span>
              </label>

              {deleteError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
                >
                  {copy.danger.dialog.error}
                </p>
              ) : null}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <AlertDialog.Close
                  disabled={isDeleting}
                  render={<Button type="button" variant="outline" size="lg" />}
                >
                  {copy.danger.dialog.back}
                </AlertDialog.Close>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  disabled={!deleteAcknowledged || isDeleting}
                  onClick={deleteEverything}
                  className="border-destructive/20"
                >
                  <Trash2 aria-hidden="true" />
                  {isDeleting
                    ? copy.danger.dialog.deleting
                    : copy.danger.dialog.confirm}
                </Button>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}
