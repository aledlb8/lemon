import { InputHTMLAttributes } from "react"

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function FormInput({ label, value, onChange, ...props }: FormInputProps) {
  return (
    <label className="text-sm">
      {label}
      <input
        className="border-border bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
        value={value}
        onChange={onChange}
        {...props}
      />
    </label>
  )
}
