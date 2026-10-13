export type NoteFieldsData = {
  weightKg?: number | null;
  bloodPressure?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  labResults?: string | null;
  notes?: string | null;
};

export function NoteFields({ data }: { data: NoteFieldsData }) {
  const { weightKg, bloodPressure, diagnosis, treatment, labResults, notes } = data;
  if (!weightKg && !bloodPressure && !diagnosis && !treatment && !labResults && !notes) return null;

  return (
    <div className="flex flex-col gap-1 text-sm whitespace-pre-wrap text-zinc-700">
      {(weightKg || bloodPressure) && (
        <p>
          {weightKg && <>Peso: {weightKg} kg</>}
          {weightKg && bloodPressure && " · "}
          {bloodPressure && <>Presión: {bloodPressure}</>}
        </p>
      )}
      {diagnosis && (
        <p>
          <strong>Diagnóstico:</strong> {diagnosis}
        </p>
      )}
      {treatment && (
        <p>
          <strong>Tratamiento:</strong> {treatment}
        </p>
      )}
      {labResults && (
        <p>
          <strong>Laboratorio:</strong> {labResults}
        </p>
      )}
      {notes && (
        <p>
          <strong>Notas:</strong> {notes}
        </p>
      )}
    </div>
  );
}
