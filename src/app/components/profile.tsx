import { useAuth } from "../auth";
import { Paper, Divider, Tag, Button } from "./paper";

export function ProfilePage({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const last = new Date(user.study_progress.last_study_at).toLocaleString();

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <p className="tracking-[0.25em] text-[#7a6a45]">PROFILE</p>
        <h2 className="italic">My Information</h2>
      </header>

      <Paper className="p-8">
        <div className="flex gap-6 items-center">
          {user.picture_url ? (
            <img src={user.picture_url} alt={user.name} className="w-20 h-20 rounded-full border border-[#cdbf9d] object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#efe6cf] border border-[#cdbf9d] flex items-center justify-center italic text-[#3a2f22]" style={{ fontSize: "1.8rem" }}>
              {user.name[0]}
            </div>
          )}
          <div>
            <p style={{ fontSize: "1.6rem" }}>{user.name}</p>
            <p className="italic text-[#5e5132]">{user.email}</p>
            <div className="mt-2 flex gap-2">
              <Tag>Member since {new Date(user.created_at).getFullYear()}</Tag>
            </div>
          </div>
        </div>

        <Divider className="my-8" />

        <h3 className="italic mb-4">Study Progress</h3>
        <div className="grid grid-cols-3 gap-6">
          <Stat label="Cards studied" value={String(user.study_progress.cards_studied)} />
          <Stat label="Current level" value={`N${user.study_progress.jlpt_level}`} />
          <Stat label="Last study" value={last} small />
        </div>

        <Divider className="my-8" />

        <h3 className="italic mb-4">Account</h3>
        <ul className="space-y-2 text-[#3a2f22]">
          <li className="flex justify-between"><span className="italic text-[#7a6a45]">User ID</span><span>{user.id}</span></li>
        </ul>

        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={onLogout}>Sign out</Button>
        </div>
      </Paper>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className="italic text-[#7a6a45]">{label}</p>
      <p style={{ fontSize: small ? "1rem" : "1.8rem" }}>{value}</p>
    </div>
  );
}
