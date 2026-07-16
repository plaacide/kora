export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-[11.5px] text-[oklch(0.48_0.16_25)] bg-chip-error-bg rounded-chip px-2.5 py-2"
    >
      {message}
    </p>
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-[11px] text-[oklch(0.48_0.16_25)] mt-0.5">
      {messages[0]}
    </p>
  );
}
