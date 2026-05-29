"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TextField, TextArea, BulletEditor } from "./fields";
import { Button, IconButton, Chip } from "./ui";
import { PlusIcon, TrashIcon } from "./icons";
import { EASE } from "./motion";
import type {
  MasterResume,
  Role,
  Project,
  Education,
  SkillGroup,
} from "@/lib/types";

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="py-5 border-t border-line first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const item = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.25, ease: EASE },
};

export function MasterResumeEditor({
  resume,
  onChange,
}: {
  resume: MasterResume;
  onChange: (next: MasterResume) => void;
}) {
  const set = (patch: Partial<MasterResume>) => onChange({ ...resume, ...patch });

  // ---- Experience ----
  const updateRole = (i: number, patch: Partial<Role>) =>
    set({
      experience: resume.experience.map((r, idx) =>
        idx === i ? { ...r, ...patch } : r,
      ),
    });
  const addRole = () =>
    set({
      experience: [
        ...resume.experience,
        { company: "", title: "", bullets: [] },
      ],
    });
  const removeRole = (i: number) =>
    set({ experience: resume.experience.filter((_, idx) => idx !== i) });

  // ---- Projects ----
  const updateProject = (i: number, patch: Partial<Project>) =>
    set({
      projects: resume.projects.map((p, idx) =>
        idx === i ? { ...p, ...patch } : p,
      ),
    });
  const addProject = () =>
    set({ projects: [...resume.projects, { name: "", bullets: [] }] });
  const removeProject = (i: number) =>
    set({ projects: resume.projects.filter((_, idx) => idx !== i) });

  // ---- Education ----
  const updateEdu = (i: number, patch: Partial<Education>) =>
    set({
      education: resume.education.map((e, idx) =>
        idx === i ? { ...e, ...patch } : e,
      ),
    });
  const addEdu = () =>
    set({ education: [...resume.education, { school: "", credential: "" }] });
  const removeEdu = (i: number) =>
    set({ education: resume.education.filter((_, idx) => idx !== i) });

  // ---- Skills ----
  const updateSkill = (i: number, patch: Partial<SkillGroup>) =>
    set({
      skills: resume.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  const addSkill = () =>
    set({ skills: [...resume.skills, { group: "", items: [] }] });
  const removeSkill = (i: number) =>
    set({ skills: resume.skills.filter((_, idx) => idx !== i) });

  return (
    <div className="px-1">
      {/* Contact */}
      <Section title="Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <TextField
            label="Name"
            value={resume.contact.name}
            onChange={(v) => set({ contact: { ...resume.contact, name: v } })}
            placeholder="Jane Doe"
          />
          <TextField
            label="Headline / title"
            value={resume.contact.title ?? ""}
            onChange={(v) => set({ contact: { ...resume.contact, title: v } })}
            placeholder="Senior Software Engineer"
          />
          <TextField
            label="Email"
            value={resume.contact.email ?? ""}
            onChange={(v) => set({ contact: { ...resume.contact, email: v } })}
            placeholder="jane@email.com"
          />
          <TextField
            label="Phone"
            value={resume.contact.phone ?? ""}
            onChange={(v) => set({ contact: { ...resume.contact, phone: v } })}
            placeholder="+1 555 123 4567"
          />
          <TextField
            label="Location"
            value={resume.contact.location ?? ""}
            onChange={(v) => set({ contact: { ...resume.contact, location: v } })}
            placeholder="San Francisco, CA"
            className="sm:col-span-2"
          />
        </div>
      </Section>

      {/* Summary */}
      <Section title="Professional summary">
        <TextArea
          value={resume.summary}
          onChange={(v) => set({ summary: v })}
          rows={4}
          placeholder="A concise summary of your experience and strengths…"
        />
      </Section>

      {/* Skills */}
      <Section
        title="Skills"
        action={
          <Button variant="subtle" size="sm" onClick={addSkill} className="text-xs">
            <PlusIcon width={14} height={14} /> Group
          </Button>
        }
      >
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {resume.skills.map((group, i) => (
              <motion.div key={i} {...item} className="overflow-hidden">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-4 gap-y-2 items-start">
                    <TextField
                      value={group.group}
                      onChange={(v) => updateSkill(i, { group: v })}
                      placeholder="Category"
                    />
                    <TextField
                      value={group.items.join(", ")}
                      onChange={(v) =>
                        updateSkill(i, {
                          items: v
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="React, TypeScript, Node…"
                      mono
                    />
                  </div>
                  <IconButton
                    onClick={() => removeSkill(i)}
                    aria-label="Remove skill group"
                    className="h-8 w-8 mt-0.5"
                  >
                    <TrashIcon width={15} height={15} />
                  </IconButton>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {resume.skills.length === 0 && (
            <p className="text-sm text-ink-soft/70">No skills yet — add a group.</p>
          )}
        </div>
      </Section>

      {/* Experience */}
      <Section
        title="Experience"
        action={
          <Button variant="subtle" size="sm" onClick={addRole} className="text-xs">
            <PlusIcon width={14} height={14} /> Role
          </Button>
        }
      >
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {resume.experience.map((role, i) => (
              <motion.div
                key={i}
                {...item}
                className="overflow-hidden rounded-xl border border-line p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <TextField
                      label="Title"
                      value={role.title}
                      onChange={(v) => updateRole(i, { title: v })}
                      placeholder="Software Engineer"
                    />
                    <TextField
                      label="Company"
                      value={role.company}
                      onChange={(v) => updateRole(i, { company: v })}
                      placeholder="Acme Inc."
                    />
                    <TextField
                      label="Start"
                      value={role.start ?? ""}
                      onChange={(v) => updateRole(i, { start: v })}
                      placeholder="Jan 2022"
                    />
                    <TextField
                      label="End"
                      value={role.end ?? ""}
                      onChange={(v) => updateRole(i, { end: v })}
                      placeholder="Present"
                    />
                  </div>
                  <IconButton
                    onClick={() => removeRole(i)}
                    aria-label="Remove role"
                    className="h-8 w-8"
                  >
                    <TrashIcon width={15} height={15} />
                  </IconButton>
                </div>
                <BulletEditor
                  bullets={role.bullets}
                  onChange={(b) => updateRole(i, { bullets: b })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {resume.experience.length === 0 && (
            <p className="text-sm text-ink-soft/70">No roles yet — add one.</p>
          )}
        </div>
      </Section>

      {/* Projects */}
      <Section
        title="Projects"
        action={
          <Button variant="subtle" size="sm" onClick={addProject} className="text-xs">
            <PlusIcon width={14} height={14} /> Project
          </Button>
        }
      >
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {resume.projects.map((proj, i) => (
              <motion.div
                key={i}
                {...item}
                className="overflow-hidden rounded-xl border border-line p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <TextField
                      label="Name"
                      value={proj.name}
                      onChange={(v) => updateProject(i, { name: v })}
                      placeholder="Project name"
                    />
                    <TextField
                      label="Stack"
                      value={proj.stack ?? ""}
                      onChange={(v) => updateProject(i, { stack: v })}
                      placeholder="Next.js, Postgres"
                    />
                    <TextField
                      label="URL"
                      value={proj.url ?? ""}
                      onChange={(v) => updateProject(i, { url: v })}
                      placeholder="https://…"
                      className="sm:col-span-2"
                    />
                  </div>
                  <IconButton
                    onClick={() => removeProject(i)}
                    aria-label="Remove project"
                    className="h-8 w-8"
                  >
                    <TrashIcon width={15} height={15} />
                  </IconButton>
                </div>
                <BulletEditor
                  bullets={proj.bullets}
                  onChange={(b) => updateProject(i, { bullets: b })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {resume.projects.length === 0 && (
            <p className="text-sm text-ink-soft/70">No projects yet.</p>
          )}
        </div>
      </Section>

      {/* Education */}
      <Section
        title="Education"
        action={
          <Button variant="subtle" size="sm" onClick={addEdu} className="text-xs">
            <PlusIcon width={14} height={14} /> Entry
          </Button>
        }
      >
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {resume.education.map((ed, i) => (
              <motion.div key={i} {...item} className="overflow-hidden">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px] gap-x-4 gap-y-2">
                    <TextField
                      value={ed.credential}
                      onChange={(v) => updateEdu(i, { credential: v })}
                      placeholder="B.S. Computer Science"
                    />
                    <TextField
                      value={ed.school}
                      onChange={(v) => updateEdu(i, { school: v })}
                      placeholder="University"
                    />
                    <TextField
                      value={ed.year ?? ""}
                      onChange={(v) => updateEdu(i, { year: v })}
                      placeholder="2020"
                    />
                  </div>
                  <IconButton
                    onClick={() => removeEdu(i)}
                    aria-label="Remove education"
                    className="h-8 w-8"
                  >
                    <TrashIcon width={15} height={15} />
                  </IconButton>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {resume.education.length === 0 && (
            <p className="text-sm text-ink-soft/70">No education entries.</p>
          )}
        </div>
      </Section>

      {/* Certifications */}
      <Section title="Certifications">
        <TextField
          value={resume.certifications.join(", ")}
          onChange={(v) =>
            set({
              certifications: v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="AWS Certified, Scrum Master…"
          mono
        />
      </Section>

      {/* Keywords */}
      <Section title="Keywords">
        <TextField
          value={resume.keywords.join(", ")}
          onChange={(v) =>
            set({
              keywords: v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="comma-separated keywords"
          mono
        />
        {resume.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {resume.keywords.slice(0, 24).map((k, i) => (
              <Chip key={i}>{k}</Chip>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
