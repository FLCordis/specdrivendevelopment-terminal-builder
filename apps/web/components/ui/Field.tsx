"use client";
export function Field({
  label, value, onChange, clarify,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  clarify?: boolean;
}) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ color: clarify ? "#ffb000" : "#00ff41" }}>
        {label}{clarify ? " ⚠" : ""}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: "block", width: "100%", background: "#040a04",
          color: "#00ff41", border: "1px solid #009922", padding: 6,
          fontFamily: "inherit",
        }}
      />
    </label>
  );
}
