import { requireUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/client";
import { Card } from "@/components/ui";
import { changePassword, deleteAccount, resendVerification, updateProfile } from "../actions";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const user = await requireUser();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Settings</h1>
      <Card title="Profile and emails">
        <ActionForm action={updateProfile}>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Name</span><input name="name" defaultValue={user.name} maxLength={120} className="input" /></label>
          <div className="break-words text-sm"><span className="font-semibold">Email:</span> {user.email} {user.emailVerifiedAt ? <span className="text-emerald-600">✓ confirmed</span> : <span className="text-amber-600">not confirmed</span>}</div>
          <fieldset className="space-y-2 text-sm">
            <legend className="mb-1 font-semibold">Email me</legend>
            <label className="flex items-start gap-2 sm:items-center"><input type="checkbox" name="emailRuns" defaultChecked={!!user.emailRuns} className="mt-1 shrink-0 sm:mt-0" /> <span>When an audit or keyword battle finishes</span></label>
            <label className="flex items-start gap-2 sm:items-center"><input type="checkbox" name="emailAlerts" defaultChecked={!!user.emailAlerts} className="mt-1 shrink-0 sm:mt-0" /> <span>Ranking alerts (big moves, top-10 changes)</span></label>
            <label className="flex items-start gap-2 sm:items-center"><input type="checkbox" name="emailWeekly" defaultChecked={!!user.emailWeekly} className="mt-1 shrink-0 sm:mt-0" /> <span>Weekly report every Monday</span></label>
          </fieldset>
          <SubmitButton pendingText="Saving…">Save</SubmitButton>
        </ActionForm>
        {!user.emailVerifiedAt && <ActionForm action={resendVerification} className="mt-4"><SubmitButton className="btn" pendingText="Sending…">Resend confirmation email</SubmitButton></ActionForm>}
      </Card>
      <Card title="Change password">
        <ActionForm action={changePassword} resetOnOk>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Current password</span><input name="current" type="password" required autoComplete="current-password" className="input" /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">New password</span><input name="password" type="password" required minLength={10} autoComplete="new-password" className="input" /></label>
          <SubmitButton pendingText="Saving…">Change password</SubmitButton>
        </ActionForm>
      </Card>
      <Card title="Delete account">
        <p className="muted mb-3 text-sm">Deletes your account, websites, keywords and reports. This cannot be undone. Cancel any paid subscription first.</p>
        <ActionForm action={deleteAccount}>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Confirm with your password</span><input name="password" type="password" required autoComplete="current-password" className="input" /></label>
          <SubmitButton className="btn !border-rose-300 !text-rose-700" pendingText="Deleting…">Delete my account</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
