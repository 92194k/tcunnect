import { useState, useEffect } from "react";
import Logo from "../components/Logo";
import { ME } from "../data";
import { supabase } from "../lib/supabase";

type Props = { onNavigate: (v: string) => void };

const DEPTS = ["CICT", "COED", "CBA", "CCS", "CON", "COE", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const PROGRAMS = [
  "BS Computer Science", "BS Information Technology", "BS Information Systems",
  "BS Education", "BS Business Administration", "BS Accountancy",
  "BS Nursing", "BS Civil Engineering", "BS Electronics Engineering",
  "BS Psychology", "Other",
];
const INTERESTS = [
  "Gaming", "Music", "K-pop", "Anime", "Coding", "Basketball",
  "Movies", "Photography", "Travel", "Food", "Fitness", "Art",
  "Reading", "Dance", "Coffee", "Hiking", "Fashion", "Vlogging",
];

const TOTAL = 9;
const MIN_AGE = 18; // Policy: strict 18+, no partial/restricted accounts for minors.

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function Onboarding({ onNavigate }: Props) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("Your Name");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const n = data.user?.user_metadata?.full_name;
      if (n) setDisplayName(n as string);
    });
  }, []);
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("");
  const [dob, setDob] = useState("");
  const [program, setProgram] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [idDocument, setIdDocument] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const age = calculateAge(dob);
  const isUnderage = age !== null && age < MIN_AGE;

  function next() { if (step < TOTAL) setStep(step + 1); }
  function back() { if (step > 1) setStep(step - 1); }

  function handleFileSelect(file: File, kind: "id" | "selfie") {
    const previewUrl = URL.createObjectURL(file);
    if (kind === "id") { setIdFile(file); setIdDocument(previewUrl); }
    else { setSelfieFile(file); setSelfie(previewUrl); }
  }

  async function finish() {
    setSubmitError(null);
    if (!idFile || !selfieFile) {
      setSubmitError("Please upload both your ID and a selfie before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("You're not signed in. Please log in again.");

      // 1. Create the real user profile row — but first check if one already
      //    exists for this account (e.g. a retry after step 2/3 failed on a
      //    previous attempt). auth_id is unique, so re-inserting would fail
      //    with a duplicate-key error even though the user's data is fine.
      const { data: existingRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authData.user.id)
        .maybeSingle();

      let userId: string;
      if (existingRow) {
        userId = existingRow.id as string;
        // Keep the row in sync in case they changed anything on a retry.
        const { error: updateError } = await supabase
          .from("users")
          .update({
            dept,
            year_level: year,
            program: program || null,
            bio: bio || null,
            interests: selectedInterests,
            date_of_birth: dob,
          })
          .eq("id", userId);
        if (updateError) throw updateError;
      } else {
        const { data: userRow, error: insertError } = await supabase
          .from("users")
          .insert({
            auth_id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.full_name ?? "Unnamed",
            dept,
            year_level: year,
            program: program || null,
            bio: bio || null,
            interests: selectedInterests,
            date_of_birth: dob,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;
        userId = userRow.id as string;
      }

      // 1b. Upload the real profile photo (public bucket — this is what
      //     shows up in Discover) now that we have a real userId for the path.
      if (photoFile) {
        const photoExt = photoFile.name.split(".").pop() || "jpg";
        const photoPath = `${userId}/photo.${photoExt}`;
        const { error: photoUploadError } = await supabase.storage
          .from("profile-photos")
          .upload(photoPath, photoFile, { upsert: true });
        if (photoUploadError) throw photoUploadError;
        const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(photoPath);
        const { error: photoUpdateError } = await supabase
          .from("users")
          .update({ photo_url: pub.publicUrl })
          .eq("id", userId);
        if (photoUpdateError) throw photoUpdateError;
      }

      // 2. Upload the real ID + selfie files to the PRIVATE verification-docs
      //    bucket (see supabase/migrations/005_storage_buckets.sql — only the
      //    owner and admins can ever read these, enforced by RLS on storage).
      const idExt = idFile.name.split(".").pop() || "jpg";
      const selfieExt = selfieFile.name.split(".").pop() || "jpg";
      const idPath = `${userId}/id.${idExt}`;
      const selfiePath = `${userId}/selfie.${selfieExt}`;

      const { error: idUploadError } = await supabase.storage
        .from("verification-docs")
        .upload(idPath, idFile, { upsert: true });
      if (idUploadError) throw idUploadError;

      const { error: selfieUploadError } = await supabase.storage
        .from("verification-docs")
        .upload(selfiePath, selfieFile, { upsert: true });
      if (selfieUploadError) throw selfieUploadError;

      // 3. Create the verification submission — this is what the admin
      //    queue reads. Face-match scoring happens server-side later
      //    (Edge Function, not built yet); status starts "pending".
      const { error: submissionError } = await supabase.from("verification_submissions").insert({
        user_id: userId,
        id_document_url: idPath,
        selfie_url: selfiePath,
        status: "pending",
      });
      if (submissionError) throw submissionError;

      onNavigate("verification-pending");
    } catch (err: any) {
      // Supabase errors (Postgrest/Storage) aren't always `instanceof Error`,
      // so check for a `.message` property too — otherwise we'd always show
      // the generic fallback and never see what actually failed.
      const message = err?.message || (err instanceof Error ? err.message : null);
      setSubmitError(message || "Something went wrong submitting your verification.");
      console.error("Onboarding submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleInterest(i: string) {
    setSelectedInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 10 ? [...prev, i] : prev
    );
  }

  const progress = (step / TOTAL) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0EBFF] via-white to-[#FFE8F0] flex items-center justify-center p-4 font-display">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Logo />
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Step {step} of {TOTAL}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 slide-up" key={step}>
          {/* Step 1: Department */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Where do you belong?</h2>
              <p className="text-slate-500 text-sm mb-6">Select your department at TCU.</p>
              <div className="grid grid-cols-2 gap-3">
                {DEPTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDept(d)}
                    className={`py-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                      dept === d
                        ? "border-primary bg-primary-light text-primary"
                        : "border-slate-200 text-slate-600 hover:border-primary/50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Year Level */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">What year are you?</h2>
              <p className="text-slate-500 text-sm mb-6">Select your current year level.</p>
              <div className="grid grid-cols-2 gap-3">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`py-5 rounded-2xl border-2 font-bold text-sm transition-all ${
                      year === y
                        ? "border-primary bg-primary-light text-primary"
                        : "border-slate-200 text-slate-600 hover:border-primary/50"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date of birth (age gate — never shown publicly) */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">When were you born?</h2>
              <p className="text-slate-500 text-sm mb-6">
                Used only to confirm you're 18+. This is never shown on your profile.
              </p>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {isUnderage && (
                <div className="mt-4 bg-like-light border border-like/30 rounded-xl px-4 py-3">
                  <p className="text-like text-sm font-semibold">
                    TCUnnect requires all users to be 18 or older. You can't continue with this date of birth.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Program */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Your program</h2>
              <p className="text-slate-500 text-sm mb-6">Optional — helps others find you easier.</p>
              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
                {PROGRAMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProgram(p)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium text-sm transition-all ${
                      program === p
                        ? "border-primary bg-primary-light text-primary"
                        : "border-slate-200 text-slate-600 hover:border-primary/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Profile photo */}
          {step === 5 && (
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Add your photo</h2>
              <p className="text-slate-500 text-sm mb-8">A clear, friendly photo helps others connect with you.</p>
              <div className="relative w-36 h-36 mx-auto mb-6">
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-primary" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100 border-4 border-dashed border-slate-300 flex items-center justify-center text-5xl">
                    👤
                  </div>
                )}
                <label className="absolute bottom-1 right-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhoto(URL.createObjectURL(f)); } }}
                  />
                </label>
              </div>
              <label className="inline-block bg-primary-light text-primary font-bold px-8 py-3 rounded-xl hover:bg-primary hover:text-white transition-all cursor-pointer">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhoto(URL.createObjectURL(f)); } }}
                />
              </label>
              <p className="text-xs text-slate-400 mt-4">You can change this anytime from your profile.</p>
            </div>
          )}

          {/* Step 6: Interests */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">What are you into?</h2>
              <p className="text-slate-500 text-sm mb-6">Pick 5–10 interests. This helps us find your best matches.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                      selectedInterests.includes(i)
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 text-slate-600 hover:border-primary/50"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <p className={`text-xs mt-2 ${selectedInterests.length < 5 ? "text-slate-400" : "text-match font-medium"}`}>
                {selectedInterests.length} / 10 selected {selectedInterests.length < 5 && "(minimum 5)"}
              </p>
            </div>
          )}

          {/* Step 7: Bio */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Tell us about yourself</h2>
              <p className="text-slate-500 text-sm mb-6">Optional short bio. Keep it light and fun!</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="e.g. Coffee-powered coder who loves anime and late-night gaming sessions 🎮"
                rows={5}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs font-medium ${bio.length > 130 ? "text-like" : "text-slate-400"}`}>
                  {bio.length} / 150
                </span>
              </div>
            </div>
          )}

          {/* Step 8: ID + selfie verification (required — this is what gates real account access) */}
          {step === 8 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Verify you're a TCU student</h2>
              <p className="text-slate-500 text-sm mb-6">
                Upload your school ID (or COE) and take a live selfie. This keeps TCUnnect
                exclusively for real TCU students and is reviewed before you get full access.
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">School ID or COE</p>
                  {idDocument ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-primary">
                      <img src={idDocument} alt="ID document" className="w-full h-40 object-cover" />
                      <button
                        onClick={() => { setIdDocument(null); setIdFile(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-40 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer">
                      <span className="text-3xl">🪪</span>
                      <span className="text-sm font-semibold">Upload ID or COE</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "id"); }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Live selfie</p>
                  {selfie ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-primary">
                      <img src={selfie} alt="Selfie" className="w-full h-40 object-cover" />
                      <button
                        onClick={() => { setSelfie(null); setSelfieFile(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-40 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer">
                      <span className="text-3xl">🤳</span>
                      <span className="text-sm font-semibold">Take a selfie</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "selfie"); }}
                      />
                    </label>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    In production this opens your camera directly — gallery uploads aren't
                    accepted here, to reduce fraud.
                  </p>
                </div>
              </div>

              <div className="mt-5 bg-[#F8F7FF] rounded-xl px-4 py-3 text-xs text-slate-500">
                Your ID and selfie are reviewed by our team and never shown publicly or shared
                with other students.
              </div>
            </div>
          )}

          {/* Step 9: Preview */}
          {step === 9 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2 text-center">Your profile preview</h2>
              <p className="text-slate-500 text-sm mb-6 text-center">This is how others will see you.</p>
              <div className="bg-[#F8F7FF] rounded-2xl overflow-hidden border border-slate-100">
                <div className="relative">
                  <img
                    src={photo || "https://placehold.co/400x300?text=%F0%9F%91%A4"}
                    alt="You"
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1033]/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white font-bold text-xl">{displayName}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{dept || "CICT"}</span>
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{year || "3rd Year"}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-1">{program || "BS Information Technology"}</p>
                  {bio && <p className="text-sm text-[#1A1033] mb-3">"{bio}"</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedInterests.length ? selectedInterests : ["Coding", "Gaming", "Music"]).slice(0, 6).map((i) => (
                      <span key={i} className="bg-primary-light text-primary text-xs px-2.5 py-1 rounded-full font-medium">{i}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          {step === TOTAL && submitError && (
            <div className="mt-6 bg-like-light border border-like/30 rounded-xl px-4 py-3 text-sm text-like font-medium">
              {submitError}
            </div>
          )}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={back} disabled={submitting} className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 transition-colors disabled:opacity-50">
                Back
              </button>
            )}
            <button
              onClick={step === TOTAL ? finish : next}
              disabled={
                submitting ||
                (step === 1 && !dept) ||
                (step === 2 && !year) ||
                (step === 3 && (!dob || isUnderage)) ||
                (step === 6 && selectedInterests.length < 5) ||
                (step === 8 && (!idDocument || !selfie))
              }
              className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === TOTAL ? (submitting ? "Submitting…" : "Submit for Review 🔒") : step === 4 || step === 5 || step === 7 ? "Continue (Skip)" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
