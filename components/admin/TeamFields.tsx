type Values = { position?: string; phone?: string | null; duties?: string };

// Isian data tim (dipakai form tambah admin dan ubah data tim). idPrefix membedakan id bila banyak form di satu halaman.
export function TeamFields({ values = {}, idPrefix = "t" }: { values?: Values; idPrefix?: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={id("position")}>Jabatan</label>
          <input id={id("position")} name="position" defaultValue={values.position} placeholder="contoh: Koordinator registrasi" className="input" />
        </div>
        <div>
          <label className="label" htmlFor={id("phone")}>No. HP / WhatsApp</label>
          <input id={id("phone")} name="phone" defaultValue={values.phone ?? ""} inputMode="tel" placeholder="0812 3456 7890" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={id("duties")}>Tugas (satu per baris)</label>
        <textarea
          id={id("duties")}
          name="duties"
          rows={3}
          defaultValue={values.duties}
          placeholder={"Scan kedatangan di bandara\nPendamping peserta hari 1"}
          className="input"
        />
      </div>
    </>
  );
}
