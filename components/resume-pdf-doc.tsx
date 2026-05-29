// Clean, single-column, selectable-text, ATS-friendly PDF. No tables/columns/graphics.
// Imported dynamically (see downloadResumePdf) so it never enters the main bundle.
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { MasterResume } from "@/lib/types";

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 52,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#14110f",
    lineHeight: 1.4,
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  title: { fontSize: 11, color: "#444", marginBottom: 4 },
  contactRow: { fontSize: 9, color: "#555", marginBottom: 12 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottom: "1pt solid #ccc",
    paddingBottom: 2,
    marginTop: 12,
    marginBottom: 6,
  },
  summary: { marginBottom: 2 },
  roleHeader: { flexDirection: "row", justifyContent: "space-between" },
  roleTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  roleMeta: { fontSize: 9, color: "#555" },
  roleSub: { fontSize: 9.5, color: "#333", marginBottom: 3 },
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillGroup: { fontFamily: "Helvetica-Bold", width: 110 },
  skillItems: { flex: 1 },
  block: { marginBottom: 7 },
  link: { color: "#3730a3", textDecoration: "none" },
});

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items
        .filter((b) => b.trim())
        .map((b, i) => (
          <View key={i} style={s.bullet}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}>{b}</Text>
          </View>
        ))}
    </>
  );
}

export function ResumeDocument({ resume }: { resume: MasterResume }) {
  const c = resume.contact;
  const contactBits = [c.email, c.phone, c.location].filter(Boolean).join("  |  ");
  return (
    <Document
      title={`Resume - ${c.name}`}
      author={c.name}
      creator="ApplyOne"
      producer="ApplyOne"
    >
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{c.name || "Your Name"}</Text>
        {c.title ? <Text style={s.title}>{c.title}</Text> : null}
        <Text style={s.contactRow}>
          {contactBits}
          {c.links && c.links.length > 0 ? (
            <>
              {contactBits ? "  |  " : ""}
              {c.links.map((l, i) => (
                <Text key={i}>
                  {i > 0 ? "  |  " : ""}
                  <Link src={l.url} style={s.link}>
                    {l.label}
                  </Link>
                </Text>
              ))}
            </>
          ) : null}
        </Text>

        {resume.summary ? (
          <View>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.summary}>{resume.summary}</Text>
          </View>
        ) : null}

        {resume.skills.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>Skills</Text>
            {resume.skills.map((g, i) => (
              <View key={i} style={s.skillRow}>
                <Text style={s.skillGroup}>{g.group}</Text>
                <Text style={s.skillItems}>{g.items.join(", ")}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {resume.experience.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.experience.map((r, i) => (
              <View key={i} style={s.block} wrap={false}>
                <View style={s.roleHeader}>
                  <Text style={s.roleTitle}>{r.title}</Text>
                  <Text style={s.roleMeta}>
                    {[r.start, r.end].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                <Text style={s.roleSub}>
                  {[r.company, r.location].filter(Boolean).join(", ")}
                </Text>
                <Bullets items={r.bullets} />
              </View>
            ))}
          </View>
        ) : null}

        {resume.projects.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>Projects</Text>
            {resume.projects.map((p, i) => (
              <View key={i} style={s.block} wrap={false}>
                <Text style={s.roleTitle}>
                  {p.name}
                  {p.stack ? ` — ${p.stack}` : ""}
                </Text>
                <Bullets items={p.bullets} />
              </View>
            ))}
          </View>
        ) : null}

        {resume.education.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>Education</Text>
            {resume.education.map((e, i) => (
              <View key={i} style={s.roleHeader}>
                <Text style={s.roleSub}>
                  {[e.credential, e.school].filter(Boolean).join(", ")}
                </Text>
                <Text style={s.roleMeta}>{e.year}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {resume.certifications.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>Certifications</Text>
            <Text>{resume.certifications.join("  •  ")}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
