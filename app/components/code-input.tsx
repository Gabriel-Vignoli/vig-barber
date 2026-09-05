"use client"

import { useRef } from "react"

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
}

const CodeInput = ({ value, onChange, length = 6 }: CodeInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const digits = Array.from({ length }, (_, i) => value[i] ?? "")

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus()
  }

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1)

    const nextDigits = [...digits]
    nextDigits[index] = digit
    onChange(nextDigits.join(""))

    if (digit && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "")

    if (!pasted) return

    onChange(pasted.slice(0, length))
    focusInput(Math.min(pasted.length, length) - 1)
  }

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="border-input bg-background focus:border-primary size-12 rounded-lg border text-center text-xl font-semibold outline-none xl:size-14 xl:text-2xl"
        />
      ))}
    </div>
  )
}

export default CodeInput
